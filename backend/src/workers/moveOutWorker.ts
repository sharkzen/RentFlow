import { Worker, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";

export const moveOutQueue = new Queue("move-out-queue", {
  connection: redisConnection as any,
});

export const startMoveOutWorker = () => {
  const worker = new Worker(
    "move-out-queue",
    async (job) => {
      if (job.name === "daily-move-out-check") {
        logger.info("[Worker] Running daily scheduled move-out check...");
        const today = new Date();

        try {
          const tenantsToMoveOut = await prisma.tenantProfile.findMany({
            where: {
              isActive: true,

              moveOutDate: {
                lte: today,
              },
            },
          });

          if (tenantsToMoveOut.length === 0) {
            logger.info("[Worker] No tenants scheduled to move out today.");
            return;
          }

          for (const tenant of tenantsToMoveOut) {
            await prisma.$transaction(async (tx) => {
              await tx.tenantProfile.update({
                where: {
                  id: tenant.id,
                },

                data: {
                  isActive: false,
                },
              });

              if (tenant.roomId) {
                await tx.room.update({
                  where: {
                    id: tenant.roomId,
                  },

                  data: {
                    status: "AVAILABLE",
                  },
                });
              }

              await tx.user.update({
                where: {
                  id: tenant.userId,
                },

                data: {
                  status: "INACTIVE",
                },
              });
            });

            logger.info(
              `[Worker] Move-out processed successfully for tenant: ${tenant.id}`,
            );
          }
        } catch (error: any) {
          logger.error(`[Worker] Failed to process move-out job: ${error}`);
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
      const repeatableJobs = await moveOutQueue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await moveOutQueue.removeRepeatableByKey(job.key);
      }

      await moveOutQueue.add(
        "daily-move-out-check",
        {},
        {
          repeat: {
            pattern: "1 0 * * *",
            tz: "Asia/Bangkok",
          },

          jobId: "daily-move-out-unique-job",
        },
      );

      logger.info("Move-Out Scheduled Job registered successfully.");
    } catch (error) {
      logger.error(`Failed to setup repeatable job for move-out: ${error}`);
    }
  })();

  return worker;
};
