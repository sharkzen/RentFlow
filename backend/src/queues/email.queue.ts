import Queue from "bull";
import "dotenv/config";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
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
