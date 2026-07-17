import { emailQueue } from "../queues/email.queue";
import { transporter } from "../config/mail";
import { getEmailTemplate } from "../utils/email-templates";
import { startMoveOutWorker } from "./moveOutWorker";
import { env } from "../config/env";
console.log("========================================");
console.log("👷 RentFlow Background Workers STARTING...");
console.log("========================================");
startMoveOutWorker();
console.log("✅ MoveOut Worker: Started successfully!");

emailQueue.on("ready", () => {
  console.log("✅ Email Worker: Connected to Redis successfully!");
});

emailQueue.on("error", (err) => {
  console.error("❌ Email Worker: Redis connection failed!", err);
});

emailQueue.process(async (job) => {
  console.log(
    `⚡ [Worker] Picked up Job ID: ${job.id} (Type: ${job.data.type})`,
  );

  try {
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
    return Promise.resolve();
  } catch (error) {
    console.error(`❌ [Worker] Job ${job.id} Failed:`, error);
    return Promise.reject(error);
  }
});
