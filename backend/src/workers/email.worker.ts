import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis";
import { transporter } from "../config/mail";
import { getEmailTemplate } from "../services/email-templates";
import { startMoveOutWorker } from "./moveOutWorker";
import { startTempCleanupWorker } from "./tempCleanupWorker";
import { startBillDueReminderWorker } from "./billDueReminderWorker";
import { startPasswordResetOtpCleanupWorker } from "./passwordResetOtpCleanupWorker";
import { env } from "../config/env";
console.log("========================================");
console.log("👷 RentFlow Background Workers STARTING...");
console.log("========================================");
startMoveOutWorker();
console.log("✅ MoveOut Worker: Started successfully!");
startTempCleanupWorker();
console.log("✅ Temp-Drafts Cleanup Worker: Started successfully!");
startBillDueReminderWorker();
console.log("✅ Bill Due-Reminder Worker: Started successfully!");
startPasswordResetOtpCleanupWorker();
console.log("✅ Password-Reset-OTP Cleanup Worker: Started successfully!");

const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log(
      `⚡ [Worker] Picked up Job ID: ${job.id} (Type: ${job.data.type})`,
    );

    const { type, to, senderName, replyTo, data } = job.data;

    console.log(`   📨 Sending email [${type}] to: ${to}`);

    const { subject, html } = getEmailTemplate(type, data);

    if (!env.MAIL_USER || !env.MAIL_PASS) {
      throw new Error("Missing MAIL_USER or MAIL_PASS in .env");
    }

    const fromAddress = `"${senderName || "RentFlow System"}" <${env.MAIL_USER}>`;
    console.log(` 📧 [Worker] Sending email to: ${to}...`);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo,
      subject,
      html,
    });

    console.log(` ✅ [Worker] Job ${job.id} SENT SUCCESS: ${info.messageId}`);
  },
  {
    connection: redisConnection as any,
  },
);

emailWorker.on("ready", () => {
  console.log("✅ Email Worker: Connected to Redis successfully!");
});

emailWorker.on("error", (err) => {
  console.error("❌ Email Worker: Redis connection failed!", err);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ [Worker] Job ${job?.id} Failed:`, error);
});
