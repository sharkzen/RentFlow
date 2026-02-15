import { emailQueue } from "../queues/email.queue";
import { transporter } from "../config/mail";
import { getEmailTemplate } from "../utils/email-templates";
import { startMoveOutWorker } from "./moveOutWorker";
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
  console.log(`⚡ [Worker] Picked up Job ID: ${job.id}`);

  try {
    const { type, to, senderName, replyTo, data } = job.data;

    console.log(`   📨 Sending email to: ${to}`);

    const { subject, html } = getEmailTemplate(type, data);

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error("Missing MAIL_USER or MAIL_PASS in .env");
    }

    const fromAddress = `"${senderName || "RentFlow System"}" <${process.env.MAIL_USER}>`;

    await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo,
      subject,
      html,
    });

    return Promise.resolve();
  } catch (error) {
    console.error(`❌ [Worker] Job ${job.id} Failed:`, error);
    return Promise.reject(error);
  }
});
