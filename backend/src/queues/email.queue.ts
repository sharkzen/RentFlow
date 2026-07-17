import Queue from "bull";
import { env } from "@/config/env";

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const emailQueue = new Queue("email", {
  redis: redisConfig,
});

emailQueue.on("ready", () => {
  console.log("✅ QUEUE: Redis Connection Ready!");
});

emailQueue.on("error", (error) => {
  console.error("❌ QUEUE: Redis Connection Error:", error);
});

emailQueue.on("active", (job) => {
  console.log(`⚡ QUEUE: Job ${job.id} is now active (Processing...)`);
});
