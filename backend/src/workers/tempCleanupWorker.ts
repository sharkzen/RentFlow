import { Worker, Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";
import { cleanupOldTempDrafts } from "@/services/r2Client";

const MAX_TEMP_AGE_MS = 24 * 60 * 60 * 1000;

export const tempCleanupQueue = new Queue("temp-cleanup-queue", {
  connection: redisConnection as any,
});

export const startTempCleanupWorker = () => {
  const worker = new Worker(
    "temp-cleanup-queue",
    async (job) => {
      if (job.name === "daily-temp-drafts-cleanup") {
        logger.info("[Worker] Running temp-drafts cleanup...");

        try {
          const { deletedCount } = await cleanupOldTempDrafts(
            MAX_TEMP_AGE_MS,
          );

          logger.info(
            `[Worker] temp-drafts cleanup done. Deleted ${deletedCount} orphaned file(s).`,
          );
        } catch (error: any) {
          logger.error(`[Worker] Failed to run temp-drafts cleanup: ${error}`);
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
      const repeatableJobs = await tempCleanupQueue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await tempCleanupQueue.removeRepeatableByKey(job.key);
      }

      await tempCleanupQueue.add(
        "daily-temp-drafts-cleanup",
        {},
        {
          repeat: {
            pattern: "30 0 * * *",
            tz: "Asia/Bangkok",
          },

          jobId: "daily-temp-drafts-cleanup-unique-job",
        },
      );

      logger.info("Temp-Drafts Cleanup Scheduled Job registered successfully.");
    } catch (error) {
      logger.error(
        `Failed to setup repeatable job for temp-drafts cleanup: ${error}`,
      );
    }
  })();

  return worker;
};
