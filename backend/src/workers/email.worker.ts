import { emailQueue } from "../queues/email.queue";
import { transporter } from "../config/mail";
import { getEmailTemplate } from "../utils/email-templates";
console.log("========================================");
console.log("👷 Email Worker Service STARTING...");
console.log("========================================");

emailQueue.on("ready", () => {
  console.log("✅ Worker: Connected to Redis successfully!");
});

emailQueue.on("error", (err) => {
  console.error("❌ Worker: Redis connection failed!", err);
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

    console.log(`✅ [Worker] Finished Job ${job.id}: Email sent.`);
    return Promise.resolve();
  } catch (error) {
    console.error(`❌ [Worker] Job ${job.id} Failed:`, error);
    return Promise.reject(error);
  }
});
