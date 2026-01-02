import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://rentflow:rentflow@localhost:5432/rentflow",
  BUCKET: process.env.S3_BUCKET!,
};
