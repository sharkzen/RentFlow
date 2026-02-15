import IORedis from "ioredis";
import logger from "@/utils/logger";

export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) =>
  logger.error(`Redis Client Error: ${err}`),
);
