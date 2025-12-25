import Fastify from "fastify";
import { env } from "@/config/env";
import "dotenv/config";
import cookie from "@fastify/cookie";
import { indexRoute } from "@/routes";
import fastifyMultipart from "@fastify/multipart";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(import("@fastify/cors"), {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await app.register(cookie, {});

  await app.register(indexRoute, { prefix: "/api" });

  return app;
}
