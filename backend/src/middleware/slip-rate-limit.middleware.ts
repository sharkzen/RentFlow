import { FastifyReply, FastifyRequest } from "fastify";
import { redisConnection } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import logger from "@/utils/logger";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 60;
const REDIS_TIMEOUT_MS = 1000;

const withTimeout = <T>(promise: Promise<T>): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("REDIS_TIMEOUT")), REDIS_TIMEOUT_MS),
    ),
  ]);

// จำกัดการส่งสลิปต่อผู้ใช้ เพราะทุกครั้งเสียโควตา SlipOK (ต้องวางหลัง authMiddleware)
export const slipUploadRateLimit = async (
  request: FastifyRequest,
  _reply: FastifyReply,
) => {
  const user = request.user as UserDecodedDto | undefined;

  if (!user?.sub) return;

  const key = `rate-limit:slip-upload:${user.sub}`;

  try {
    const count = await withTimeout(redisConnection.incr(key));

    if (count === 1) {
      await withTimeout(redisConnection.expire(key, WINDOW_SECONDS));
    }

    if (count > MAX_ATTEMPTS) {
      throw new AppError(429, "TOO_MANY_REQUESTS");
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Redis ล่ม ไม่ควรทำให้ผู้เช่าจ่ายเงินไม่ได้
    logger.error(`Slip rate limit check failed: ${error}`);
  }
};
