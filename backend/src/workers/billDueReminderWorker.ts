import { Worker, Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { formatDateTH } from "@/utils/date";
import { env } from "@/config/env";

export const billDueReminderQueue = new Queue("bill-due-reminder-queue", {
  connection: redisConnection as any,
});

export const startBillDueReminderWorker = () => {
  const worker = new Worker(
    "bill-due-reminder-queue",
    async (job) => {
      if (job.name === "daily-bill-due-reminder") {
        logger.info("[Worker] Running daily bill due-date reminder check...");

        const startOfTomorrow = new Date();
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        startOfTomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        try {
          const bills = await prisma.bill.findMany({
            where: {
              status: "PENDING",
              archived: false,
              reminderSentAt: null,

              dueDate: {
                gte: startOfTomorrow,
                lte: endOfTomorrow,
              },

              tenant: {
                email: {
                  not: null,
                },
              },
            },

            include: {
              room: {
                include: {
                  dormitory: {
                    include: {
                      contacts: {
                        orderBy: {
                          order: "asc",
                        },
                        take: 1,
                      },
                    },
                  },
                },
              },

              tenant: true,
            },
          });

          if (bills.length === 0) {
            logger.info("[Worker] No bills due tomorrow that need a reminder.");
            return;
          }

          let queuedCount = 0;

          for (const bill of bills) {
            if (!bill.tenant?.email) continue;

            try {
              await emailQueue.add(EMAIL_JOB_NAME, {
                type: EmailType.BILL_DUE_REMINDER,
                to: bill.tenant.email,
                senderName: bill.room.dormitory.name,

                data: {
                  dormName: bill.room.dormitory.name,
                  ownerPhone: bill.room.dormitory.contacts?.[0]?.phone || "-",
                  tenantName: bill.tenantNameSnapshot,
                  roomNumber: bill.roomNumberSnapshot,
                  month: formatDateTH(bill.billingMonth),
                  dueDate: formatDateTH(bill.dueDate),

                  amount: bill.total.toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  }),

                  link: `${env.FRONTEND_URL}/tenant/bills/${bill.id}`,
                },
              });

              await prisma.bill.update({
                where: {
                  id: bill.id,
                },

                data: {
                  reminderSentAt: new Date(),
                },
              });

              queuedCount++;
            } catch (queueErr) {
              logger.error(
                `[Worker] Failed to queue bill-due-reminder email (bill ${bill.id}): ${queueErr}`,
              );
            }
          }

          logger.info(
            `[Worker] Bill due-date reminder done. Queued ${queuedCount} email(s).`,
          );
        } catch (error: any) {
          logger.error(
            `[Worker] Failed to process bill-due-reminder job: ${error}`,
          );
        }
      }
    },
    {
      connection: redisConnection as any,
    },
  );

  worker.on("completed", (job) => logger.info(`Job ${job.id} has completed!`));
  worker.on("failed", (job, err) =>
    logger.error(`Job ${job?.id} has failed: ${err}`),
  );

  (async () => {
    try {
      const repeatableJobs = await billDueReminderQueue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await billDueReminderQueue.removeRepeatableByKey(job.key);
      }

      await billDueReminderQueue.add(
        "daily-bill-due-reminder",
        {},
        {
          repeat: {
            pattern: "0 8 * * *",
            tz: "Asia/Bangkok",
          },

          jobId: "daily-bill-due-reminder-unique-job",
        },
      );

      logger.info(
        "Bill Due-Date Reminder Scheduled Job registered successfully.",
      );
    } catch (error) {
      logger.error(
        `Failed to setup repeatable job for bill-due-reminder: ${error}`,
      );
    }
  })();

  return worker;
};
