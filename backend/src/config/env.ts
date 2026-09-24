import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .default("postgresql://rentflow:rentflow@localhost:5432/rentflow"),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  RESET_SECRET: z.string(),
  ENCRYPTION_KEY: z.string(),
  QR_PEPPER_SECRET: z.string(),
  OTP_PEPPER_SECRET: z.string(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_TOKEN: z.string().optional(),
  S3_BUCKET: z.string(),
  BUCKET_NAME: z.string().optional(),
  PUBLIC_PATH: z.string().optional(),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  SLIPOK_BRANCH_ID: z.string().optional(),
  SLIPOK_API_KEY: z.string().optional(),
  OCR_SERVICE_URL: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  PORT: parsed.PORT,
  FRONTEND_URL: parsed.FRONTEND_URL,
  DATABASE_URL: parsed.DATABASE_URL,
  BUCKET: parsed.S3_BUCKET,
};
