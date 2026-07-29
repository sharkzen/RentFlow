import Fastify from "fastify";
import { env } from "@/config/env";
import "dotenv/config";
import cookie from "@fastify/cookie";
import { indexRoute } from "@/routes";
import fastifyMultipart from "@fastify/multipart";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import os from "os";
import figlet from "figlet";
import prisma from "@/lib/prisma";
import { emailQueue } from "@/queues/email.queue";
import { getBrowserInstance } from "./modules/tenant/lib/tenant.lib";
import fastifyStatic from "@fastify/static";
import path from "path";
import { AppError } from "@/lib/errors";
import { ZodError } from "zod";
import { registerSwagger } from "@/config/swagger";
import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.code,

        ...(env.NODE_ENV !== "production" && {
          detail: error.message,
        }),
      });
    }

    if (error instanceof ZodError || (error as any).issues) {
      return reply.status(400).send({
        message: "VALIDATION_ERROR",
        issues: (error as any).issues,
      });
    }

    request.log.error(error);

    return reply.status(500).send({
      message: "INTERNAL_SERVER_ERROR",
    });
  });

  await getBrowserInstance();

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "../public"),
    prefix: "/public/",
  });

  app.get(
    "/api/status",
    {
      preHandler: [authMiddleware, authRoleMiddleware([Role.ADMIN])],
    },
    async (request, reply) => {
      const uptime = process.uptime();
      const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);
      const memoryUsage = process.memoryUsage();
      const appMemory = (memoryUsage.rss / 1024 / 1024).toFixed(2);
      const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
      const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
      const usedSystemMem = (os.totalmem() - os.freemem()) / 1024 / 1024 / 1024;
      const cpuLoad = os.loadavg()[0].toFixed(2);
      const platform = `${os.type()} ${os.release()} (${os.arch()})`;

      const logo = await new Promise<string>((resolve) => {
        figlet(
          "RentFlow",
          {
            font: "Standard",
          },
          (err, data) => {
            resolve(data || "RentFlow System");
          },
        );
      });

      const services = [];

      services.push({
        name: "API Server",
        status: "ONLINE",
        latency: "0ms",
      });

      const dbStart = performance.now();

      try {
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = (performance.now() - dbStart).toFixed(2);

        services.push({
          name: "Database (Postgres)",
          status: "ONLINE",
          latency: `${dbLatency}ms`,
        });
      } catch (error) {
        services.push({
          name: "Database (Postgres)",
          status: "OFFLINE",
          latency: "ERROR",
        });

        app.log.error(error);
      }

      const redisStart = performance.now();

      try {
        const client = await emailQueue.client;
        await client.ping();
        const redisLatency = (performance.now() - redisStart).toFixed(2);

        services.push({
          name: "Redis Cache",
          status: "ONLINE",
          latency: `${redisLatency}ms`,
        });
      } catch (error) {
        services.push({
          name: "Redis Cache",
          status: "OFFLINE",
          latency: "ERROR",
        });
      }

      try {
        const counts = await emailQueue.getJobCounts();
        const waitingJobs = counts.waiting + counts.active;

        services.push({
          name: "Worker Queue",
          status: "ONLINE",
          latency: `Jobs: ${waitingJobs}`,
        });
      } catch (error) {
        services.push({
          name: "Worker Queue",
          status: "OFFLINE",
          latency: "ERROR",
        });
      }

      const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RentFlow System Status</title>
      <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          background-color: #0d0d0d;
          color: #00ff41; /* Hacker Green */
          font-family: 'Fira Code', monospace;
          margin: 0;
          padding: 20px;
          height: 100vh;
          overflow: hidden;
          text-shadow: 0 0 5px rgba(0, 255, 65, 0.5);
        }
        
        /* CRT Effect */
        body::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .ascii-art {
          white-space: pre;
          color: #00ff41;
          font-weight: bold;
          margin-bottom: 20px;
          font-size: 12px;
        }
        @media (min-width: 600px) {
           .ascii-art { font-size: 16px; }
        }

        .section-title {
          border-bottom: 1px dashed #00ff41;
          padding-bottom: 5px;
          margin-top: 20px;
          margin-bottom: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }

        .status-online { color: #00ff41; }
        .status-offline { color: #ff0000; text-shadow: 0 0 5px red; font-weight: bold; }
        .blink { animation: blinker 1s linear infinite; }

        @keyframes blinker {
          50% { opacity: 0; }
        }

        .cursor::after {
          content: '█';
          animation: blinker 1s step-end infinite;
        }
      </style>
      <script>
        // Auto Refresh every 5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      </script>
    </head>
    <body>
      <div class="container">
        <div class="ascii-art">${logo}</div>
        
        <div>> SYSTEM_CHECK_INITIATED...</div>
        <div>> USER: ADMIN</div>
        <div>> DATE: ${new Date().toISOString()}</div>
        <br>

        <div class="section-title">APP RESOURCES (API Node.js)</div>
        <div class="stat-row"><span>Process Memory (RSS):</span> <span>${appMemory} MB</span></div>
        <div class="stat-row"><span>Server Uptime:</span> <span>${uptimeString}</span></div>
        
        <div class="section-title">SYSTEM RESOURCES (Container/Host)</div>
        <div class="stat-row"><span>OS Platform:</span> <span>${platform}</span></div>
        <div class="stat-row"><span>CPU Load (1m):</span> <span>${cpuLoad}%</span></div>
        <div class="stat-row">
            <span>System Memory:</span> 
            <span>${usedSystemMem.toFixed(2)} GB / ${totalMem} GB</span>
        </div>
        <div class="stat-row">
            <span>Free Memory:</span> 
            <span>${freeMem} GB</span>
        </div>

        <div class="section-title">SERVICE STATUS</div>
        ${services
          .map(
            (s) => `
          <div class="stat-row">
            <span>[ ${s.name} ]</span>
            <span>
              <span class="${s.status === "ONLINE" ? "status-online" : "status-offline"}">${s.status}</span> 
              (${s.latency})
            </span>
          </div>
        `,
          )
          .join("")}

        <br>
        <div class="cursor">> WAITING_FOR_COMMAND</div>
      </div>
    </body>
    </html>
    `;

      reply.type("text/html").send(html);
    },
  );

  await app.register(import("@fastify/cors"), {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await app.register(cookie, {});
  await registerSwagger(app);

  await app.register(indexRoute, {
    prefix: "/api",
  });

  return app;
}
