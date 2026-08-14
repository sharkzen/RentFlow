import { Worker, Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";

export const passwordResetOtpCleanupQueue = new Queue(
  "password-reset-otp-cleanup-queue",
  {
    connection: redisConnection as any,
  },
);

export const startPasswordResetOtpCleanupWorker = () => {
  const worker = new Worker(
    "password-reset-otp-cleanup-queue",
    async (job) => {
      if (job.name === "daily-password-reset-otp-cleanup") {
        logger.info("[Worker] Running password-reset-otp cleanup...");

        try {
          const { count } = await prisma.passwordResetOtp.deleteMany({
            where: {
              expiresAt: {
                lt: new Date(),
              },
            },
          });

          logger.info(
            `[Worker] password-reset-otp cleanup done. Deleted ${count} expired OTP row(s).`,
          );
        } catch (error: any) {
          logger.error(
            `[Worker] Failed to run password-reset-otp cleanup: ${error}`,
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
      const repeatableJobs =
        await passwordResetOtpCleanupQueue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await passwordResetOtpCleanupQueue.removeRepeatableByKey(job.key);
      }

      await passwordResetOtpCleanupQueue.add(
        "daily-password-reset-otp-cleanup",
        {},
        {
          repeat: {
            pattern: "0 1 * * *",
            tz: "Asia/Bangkok",
          },

          jobId: "daily-password-reset-otp-cleanup-unique-job",
        },
      );

      logger.info(
        "Password-Reset-OTP Cleanup Scheduled Job registered successfully.",
      );
    } catch (error) {
      logger.error(
        `Failed to setup repeatable job for password-reset-otp cleanup: ${error}`,
      );
    }
  })();

  return worker;
};
