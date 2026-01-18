import { emailQueue } from "../queues/email.queue";

async function run() {
  await emailQueue.add({
    to: "payuttobunma.pt@gmail.com",
    subject: "ทดสอบ RentFlow",
    html: "<b>ระบบส่งเมลพร้อมใช้งาน 🎉</b>",
  });

  console.log("📤 Email job added");
}

run();
