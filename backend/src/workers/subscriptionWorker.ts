import { Worker, Queue } from "bullmq";
import { redisConnection } from "@/lib/redis";
import logger from "@/utils/logger";
import prisma from "@/lib/prisma";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { formatDateTH } from "@/utils/date";
import { env } from "@/config/env";
import {
  SETTING_KEYS,
  getNumberSetting,
  getPlatformSlipUsage,
} from "@/lib/entitlements";

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = [7, 3, 1];
const JOB_NAME = "daily-subscription-maintenance";

export const subscriptionQueue = new Queue("subscription-queue", {
  connection: redisConnection as any,
});

/** กันส่งอีเมลซ้ำเมื่อ job รันซ้ำ (SET NX): คืน true เมื่อเป็นครั้งแรก */
async function firstTime(key: string, ttlSeconds: number) {
  const res = await redisConnection.set(key, "1", "EX", ttlSeconds, "NX");
  return res === "OK";
}

async function sendEmail(
  to: string,
  type: EmailType,
  data: Record<string, unknown>,
) {
  await emailQueue.add(EMAIL_JOB_NAME, {
    type,
    to,
    senderName: "RentFlow",
    data: { ...data, link: `${env.FRONTEND_URL}/owner/billing` },
  });
}

export async function runSubscriptionMaintenance(now = new Date()) {
  const graceDays = await getNumberSetting(SETTING_KEYS.graceDays);

  // 1) ย้ายสถานะตามวันที่ และส่งอีเมลหมดอายุครั้งเดียวตอนเข้าสู่ GRACE
  const lapsed = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL", "GRACE"] },
      currentPeriodEnd: { lt: now },
    },
    include: {
      plan: { select: { name: true } },
      owner: { select: { fullName: true, user: { select: { email: true } } } },
    },
  });

  for (const sub of lapsed) {
    const end = sub.currentPeriodEnd!;
    const graceEnd = new Date(end.getTime() + graceDays * DAY_MS);
    const next = graceEnd >= now ? "GRACE" : "EXPIRED";

    if (next !== sub.status) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: next },
      });
    }

    if (
      sub.status !== "GRACE" &&
      sub.owner.user.email &&
      (await firstTime(`sub-expired:${sub.id}:${end.toISOString()}`, 30 * 86400))
    ) {
      await sendEmail(sub.owner.user.email, EmailType.SUBSCRIPTION_EXPIRED, {
        ownerName: sub.owner.fullName,
        planName: sub.plan.name,
        graceEndsAt: formatDateTH(graceEnd),
      }).catch((e) =>
        logger.error(`[Worker] expired email failed (sub ${sub.id}): ${e}`),
      );
    }
  }

  // 2) เตือนก่อนหมดอายุ 7 / 3 / 1 วัน
  const horizon = new Date(now.getTime() + Math.max(...REMINDER_DAYS) * DAY_MS);
  const expiring = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL"] },
      currentPeriodEnd: { gte: now, lte: horizon },
    },
    include: {
      plan: { select: { name: true } },
      owner: { select: { fullName: true, user: { select: { email: true } } } },
    },
  });

  let reminded = 0;

  for (const sub of expiring) {
    const end = sub.currentPeriodEnd!;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / DAY_MS);

    if (!REMINDER_DAYS.includes(daysLeft) || !sub.owner.user.email) continue;

    const key = `sub-reminder:${sub.id}:${daysLeft}:${end.toISOString()}`;
    if (!(await firstTime(key, 3 * 86400))) continue;

    try {
      await sendEmail(sub.owner.user.email, EmailType.SUBSCRIPTION_EXPIRING, {
        ownerName: sub.owner.fullName,
        planName: sub.plan.name,
        daysLeft,
        endDate: formatDateTH(end),
      });
      reminded++;
    } catch (e) {
      logger.error(`[Worker] reminder email failed (sub ${sub.id}): ${e}`);
    }
  }

  // 3) โปรโมทหมดเวลา ช่องว่างลงทันที
  const promos = await prisma.dormPromotion.updateMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "EXPIRED" },
  });

  // 4) คำสั่งซื้อค้าง: โปรโมทเกินเวลาจอง 24 ชม. / แพ็คค้างเกิน 7 วัน
  const staleOrders = await prisma.billingOrder.updateMany({
    where: {
      status: "PENDING",
      OR: [
        {
          type: "PROMOTION",
          holdUntil: { lt: new Date(now.getTime() - DAY_MS) },
        },
        { type: "PLAN", createdAt: { lt: new Date(now.getTime() - 7 * DAY_MS) } },
      ],
    },
    data: { status: "EXPIRED", note: "หมดเวลาชำระ" },
  });

  // 5) เตือนเมื่อโควต้า SlipOK รวมของแพลตฟอร์มใกล้หมด
  const slip = await getPlatformSlipUsage();
  if (slip.percent !== null && slip.percent >= 80) {
    logger.warn(
      `[Worker] SlipOK platform quota at ${slip.percent}% (${slip.total}/${slip.quota}) for ${slip.period}`,
    );
  }

  logger.info(
    `[Worker] Subscription maintenance done: lapsed=${lapsed.length}, reminders=${reminded}, promotionsExpired=${promos.count}, ordersExpired=${staleOrders.count}`,
  );
}

export const startSubscriptionWorker = () => {
  const worker = new Worker(
    "subscription-queue",
    async (job) => {
      if (job.name !== JOB_NAME) return;

      logger.info("[Worker] Running daily subscription maintenance...");

      try {
        await runSubscriptionMaintenance();
      } catch (error) {
        logger.error(`[Worker] Subscription maintenance failed: ${error}`);
        throw error;
      }
    },
    { connection: redisConnection as any },
  );

  worker.on("completed", (job) => logger.info(`Job ${job.id} has completed!`));
  worker.on("failed", (job, err) =>
    logger.error(`Job ${job?.id} has failed: ${err}`),
  );

  (async () => {
    try {
      const repeatableJobs = await subscriptionQueue.getRepeatableJobs();

      for (const job of repeatableJobs) {
        await subscriptionQueue.removeRepeatableByKey(job.key);
      }

      await subscriptionQueue.add(
        JOB_NAME,
        {},
        {
          repeat: { pattern: "0 9 * * *", tz: "Asia/Bangkok" },
          jobId: `${JOB_NAME}-unique-job`,
        },
      );

      logger.info("Subscription Maintenance Scheduled Job registered.");
    } catch (error) {
      logger.error(`Failed to setup repeatable job for subscription: ${error}`);
    }
  })();

  return worker;
};
