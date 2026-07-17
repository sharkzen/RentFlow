import IORedis from "ioredis";
import logger from "@/utils/logger";
import { env } from "@/config/env";

export const redisConnection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

redisConnection.on("error", (err) =>
  logger.error(`Redis Client Error: ${err}`),
);
