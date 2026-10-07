import { Plan, Prisma, SubscriptionStatus } from "@prisma/client";
import prisma from "./prisma";
import { AppError } from "./errors";

type Db = Prisma.TransactionClient | typeof prisma;

export const SETTING_KEYS = {
  trialEnabled: "trialEnabled",
  trialPlanId: "trialPlanId",
  trialDays: "trialDays",
  graceDays: "graceDays",
  promptPayId: "promptPayId",
  promptPayName: "promptPayName",
  promoPricePerMonth: "promoPricePerMonth",
  promoMaxSlots: "promoMaxSlots",
  promoHoldMinutes: "promoHoldMinutes",
  enforceLimits: "enforceLimits",
} as const;

export const SETTING_DEFAULTS: Record<string, string> = {
  trialEnabled: "true",
  trialDays: "14",
  graceDays: "7",
  promoPricePerMonth: "199",
  promoMaxSlots: "10",
  promoHoldMinutes: "60",
  // ปิดไว้ก่อนเพื่อไม่ให้เจ้าของหอเดิมถูกจำกัดทันที แอดมินเปิดเมื่อพร้อมเก็บเงิน
  enforceLimits: "false",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getSetting(key: string, db: Db = prisma) {
  const row = await db.platformSetting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key] ?? null;
}

export async function getNumberSetting(key: string, db: Db = prisma) {
  const value = await getSetting(key, db);
  const n = Number(value);
  return Number.isFinite(n) ? n : Number(SETTING_DEFAULTS[key] ?? 0);
}

export type Entitlements = {
  plan: Plan;
  status: SubscriptionStatus | "FREE";
  /** ใช้ฟีเจอร์เต็มได้ (ทดลองหรือชำระแล้ว) */
  canManage: boolean;
  /** หมดอายุแล้ว: อ่านอย่างเดียว ห้ามเพิ่มหอ/ห้อง/บิลใหม่ */
  readOnly: boolean;
  periodEnd: Date | null;
  graceEndsAt: Date | null;
  usage: { dorms: number; rooms: number };
};

async function getFreePlan(db: Db) {
  const plan = await db.plan.findFirst({
    where: { isFree: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!plan) throw AppError.internal("FREE_PLAN_MISSING");
  return plan;
}

export async function getUsage(ownerId: string, db: Db = prisma) {
  const [dorms, rooms] = await Promise.all([
    db.dormitory.count({ where: { ownerId, deletedAt: null } }),
    db.room.count({
      where: { deletedAt: null, dormitory: { ownerId, deletedAt: null } },
    }),
  ]);
  return { dorms, rooms };
}

/**
 * คำนวณสถานะจริงจากวันที่ (lazy) เพื่อไม่ต้องรอ worker รายวัน
 * ACTIVE/TRIAL ที่เลย periodEnd -> GRACE (ภายใน graceDays) -> EXPIRED
 */
export async function getEntitlements(
  ownerId: string,
  db: Db = prisma,
): Promise<Entitlements> {
  const [sub, usage, graceDays] = await Promise.all([
    db.subscription.findUnique({
      where: { ownerId },
      include: { plan: true },
    }),
    getUsage(ownerId, db),
    getNumberSetting(SETTING_KEYS.graceDays, db),
  ]);

  if (!sub) {
    const plan = await getFreePlan(db);
    return {
      plan,
      status: "FREE",
      canManage: false,
      readOnly: false,
      periodEnd: null,
      graceEndsAt: null,
      usage,
    };
  }

  const now = Date.now();
  const end = sub.currentPeriodEnd;
  const graceEndsAt = end ? new Date(end.getTime() + graceDays * DAY_MS) : null;

  let status: SubscriptionStatus = sub.status;
  if (status === "ACTIVE" || status === "TRIAL" || status === "GRACE") {
    if (end && end.getTime() < now) {
      status = graceEndsAt && graceEndsAt.getTime() >= now ? "GRACE" : "EXPIRED";
    }
  }

  return {
    plan: sub.plan,
    status,
    canManage: status === "ACTIVE" || status === "TRIAL",
    readOnly: status === "GRACE" || status === "EXPIRED",
    periodEnd: end,
    graceEndsAt,
    usage,
  };
}

async function isEnforced(db: Db) {
  return (await getSetting(SETTING_KEYS.enforceLimits, db)) === "true";
}

export async function assertCanCreateDorm(ownerId: string, db: Db = prisma) {
  if (!(await isEnforced(db))) return null;

  const ent = await getEntitlements(ownerId, db);
  if (ent.readOnly) {
    throw AppError.forbidden(
      "SUBSCRIPTION_READ_ONLY",
      "แพ็คเกจหมดอายุ กรุณาต่ออายุเพื่อเพิ่มหอพัก",
    );
  }
  if (ent.usage.dorms >= ent.plan.maxDorms) {
    throw AppError.forbidden(
      "DORM_LIMIT_REACHED",
      `แพ็คเกจนี้สร้างหอพักได้สูงสุด ${ent.plan.maxDorms} หอ`,
    );
  }
  return ent;
}

export async function assertCanCreateRooms(
  ownerId: string,
  adding: number,
  db: Db = prisma,
) {
  if (!(await isEnforced(db))) return null;

  const ent = await getEntitlements(ownerId, db);
  if (ent.readOnly) {
    throw AppError.forbidden(
      "SUBSCRIPTION_READ_ONLY",
      "แพ็คเกจหมดอายุ กรุณาต่ออายุเพื่อเพิ่มห้องพัก",
    );
  }
  if (ent.usage.rooms + adding > ent.plan.maxRooms) {
    throw AppError.forbidden(
      "ROOM_LIMIT_REACHED",
      `แพ็คเกจนี้สร้างห้องพักได้สูงสุด ${ent.plan.maxRooms} ห้อง (ปัจจุบัน ${ent.usage.rooms})`,
    );
  }
  return ent;
}
