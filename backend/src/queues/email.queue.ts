import { Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";

export const EMAIL_JOB_NAME = "send-email";

export const emailQueue = new Queue("email", {
  connection: redisConnection as any,
});

emailQueue.on("error", (error) => {
  logger.error(`❌ QUEUE: Redis Connection Error: ${error}`);
});
