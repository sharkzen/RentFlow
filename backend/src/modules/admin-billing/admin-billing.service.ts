import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import {
  SETTING_DEFAULTS,
  SETTING_KEYS,
  getNumberSetting,
  getPlatformSlipUsage,
  getSetting,
} from "@/lib/entitlements";
import { createActivityLog } from "@/services/activity-log.service";
import { BillingService } from "@/modules/billing/billing.service";
import { BillingOrderStatus, Prisma } from "@prisma/client";
import logger from "@/utils/logger";
import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).nullable().optional(),
  priceMonthly: z.number().min(0),
  maxDorms: z.number().int().min(0),
  maxRooms: z.number().int().min(0),
  slipQuotaMonthly: z.number().int().min(0),
  slipOverageRate: z.number().min(0).nullable().optional(),
  slipUnlimited: z.boolean().optional(),
  hasOcr: z.boolean().optional(),
  discountPct3m: z.number().min(0).max(100).optional(),
  discountPct6m: z.number().min(0).max(100).optional(),
  discountPct12m: z.number().min(0).max(100).optional(),
  allowTrial: z.boolean().optional(),
  isFree: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const settingsSchema = z.object({
  trialEnabled: z.boolean().optional(),
  trialPlanId: z.string().nullable().optional(),
  trialDays: z.number().int().min(1).max(365).optional(),
  graceDays: z.number().int().min(0).max(90).optional(),
  promptPayId: z.string().trim().max(30).optional(),
  promptPayName: z.string().trim().max(100).optional(),
  bankName: z.string().trim().max(30).optional(),
  bankAccountNumber: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9-]*$/, "เลขบัญชีใช้ได้เฉพาะตัวเลขและขีด")
    .optional(),
  bankAccountName: z.string().trim().max(100).optional(),
  promoPricePerMonth: z.number().min(0).optional(),
  promoMaxSlots: z.number().int().min(0).optional(),
  promoHoldMinutes: z.number().int().min(5).max(1440).optional(),
  enforceLimits: z.boolean().optional(),
  slipOkPlatformQuota: z.number().int().min(0).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, _ และ -")
      .transform((v) => v.toUpperCase()),
    description: z.string().trim().max(200).nullable().optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().positive(),
    appliesTo: z.enum(["PLAN", "PROMOTION", "BOTH"]).default("BOTH"),
    planIds: z.array(z.string()).default([]),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    maxRedemptions: z.number().int().positive().nullable().optional(),
    perOwnerLimit: z.number().int().min(1).default(1),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, {
    message: "ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100",
    path: ["value"],
  })
  .refine(
    (v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) < new Date(v.endsAt),
    { message: "วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น", path: ["endsAt"] },
  );

export const reviewOrderSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(300).optional(),
});

const couponData = (input: z.infer<typeof couponSchema>) => ({
  ...input,
  startsAt: input.startsAt ? new Date(input.startsAt) : null,
  endsAt: input.endsAt ? new Date(input.endsAt) : null,
  maxRedemptions: input.maxRedemptions ?? null,
});

/** แพ็คเกจ FREE ต้องมีได้แค่ตัวเดียว เพื่อให้ getEntitlements เลือกได้แน่นอน */
async function assertSingleFreePlan(exceptId?: string) {
  const other = await prisma.plan.findFirst({
    where: { isFree: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  if (other) {
    throw AppError.conflict(
      "FREE_PLAN_EXISTS",
      "มีแพ็คเกจฟรีอยู่แล้ว แก้ไขตัวเดิมแทน",
    );
  }
}

export const AdminBillingService = {
  listPlans: async () => {
    const plans = await prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { subscriptions: true } } },
    });
    return { success: true, data: plans };
  },

  createPlan: async (input: z.infer<typeof planSchema>, adminId: string) => {
    if (input.isFree) await assertSingleFreePlan();

    const plan = await prisma.plan.create({ data: input });

    await createActivityLog({
      userId: adminId,
      action: "CREATE_PLAN",
      entityType: "Plan",
      entityId: plan.id,
    });

    return { success: true, data: plan };
  },

  updatePlan: async (
    id: string,
    input: z.infer<typeof planSchema>,
    adminId: string,
  ) => {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("PLAN_NOT_FOUND", "ไม่พบแพ็คเกจ");

    if (input.isFree) await assertSingleFreePlan(id);
    if (existing.isFree && input.isFree === false) {
      throw AppError.badRequest(
        "FREE_PLAN_REQUIRED",
        "ต้องมีแพ็คเกจฟรีอย่างน้อย 1 ตัว",
      );
    }

    const plan = await prisma.plan.update({ where: { id }, data: input });

    await createActivityLog({
      userId: adminId,
      action: "UPDATE_PLAN",
      entityType: "Plan",
      entityId: id,
    });

    return { success: true, data: plan };
  },

  /** ไม่ลบจริงถ้ามีคนใช้อยู่ เพื่อไม่ให้ subscription เดิมอ้างอิงแพ็คที่หายไป */
  deletePlan: async (id: string, adminId: string) => {
    const existing = await prisma.plan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true, orders: true } } },
    });
    if (!existing) throw AppError.notFound("PLAN_NOT_FOUND", "ไม่พบแพ็คเกจ");
    if (existing.isFree) {
      throw AppError.badRequest(
        "FREE_PLAN_REQUIRED",
        "ไม่สามารถลบแพ็คเกจฟรีได้",
      );
    }

    const inUse = existing._count.subscriptions + existing._count.orders > 0;

    if (inUse) {
      await prisma.plan.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.plan.delete({ where: { id } });
    }

    await createActivityLog({
      userId: adminId,
      action: inUse ? "DEACTIVATE_PLAN" : "DELETE_PLAN",
      entityType: "Plan",
      entityId: id,
    });

    return { success: true, deactivated: inUse };
  },

  listCoupons: async () => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    });
    return { success: true, data: coupons };
  },

  createCoupon: async (input: z.infer<typeof couponSchema>, adminId: string) => {
    const exists = await prisma.coupon.findUnique({
      where: { code: input.code },
    });
    if (exists) throw AppError.conflict("COUPON_CODE_EXISTS", "รหัสคูปองนี้มีอยู่แล้ว");

    const coupon = await prisma.coupon.create({ data: couponData(input) });

    await createActivityLog({
      userId: adminId,
      action: "CREATE_COUPON",
      entityType: "Coupon",
      entityId: coupon.id,
    });

    return { success: true, data: coupon };
  },

  updateCoupon: async (
    id: string,
    input: z.infer<typeof couponSchema>,
    adminId: string,
  ) => {
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("COUPON_NOT_FOUND", "ไม่พบคูปอง");

    if (input.code !== existing.code) {
      const dup = await prisma.coupon.findUnique({ where: { code: input.code } });
      if (dup) throw AppError.conflict("COUPON_CODE_EXISTS", "รหัสคูปองนี้มีอยู่แล้ว");
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: couponData(input),
    });

    await createActivityLog({
      userId: adminId,
      action: "UPDATE_COUPON",
      entityType: "Coupon",
      entityId: id,
    });

    return { success: true, data: coupon };
  },

  /** คูปองที่เคยถูกใช้แล้วลบไม่ได้ (ประวัติคำสั่งซื้ออ้างอิงอยู่) จึงปิดการใช้งานแทน */
  deleteCoupon: async (id: string, adminId: string) => {
    const existing = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true, orders: true } } },
    });
    if (!existing) throw AppError.notFound("COUPON_NOT_FOUND", "ไม่พบคูปอง");

    const inUse = existing._count.redemptions + existing._count.orders > 0;

    if (inUse) {
      await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.coupon.delete({ where: { id } });
    }

    await createActivityLog({
      userId: adminId,
      action: inUse ? "DEACTIVATE_COUPON" : "DELETE_COUPON",
      entityType: "Coupon",
      entityId: id,
    });

    return { success: true, deactivated: inUse };
  },

  listOrders: async (query: {
    status?: string;
    type?: string;
    page: number;
    limit: number;
  }) => {
    const where: Prisma.BillingOrderWhereInput = {};

    if (query.status && query.status in BillingOrderStatus) {
      where.status = query.status as BillingOrderStatus;
    }
    if (query.type === "PLAN" || query.type === "PROMOTION") {
      where.type = query.type;
    }

    const [total, orders] = await Promise.all([
      prisma.billingOrder.count({ where }),
      prisma.billingOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          plan: { select: { name: true } },
          dorm: { select: { name: true } },
          coupon: { select: { code: true } },
          owner: { select: { fullName: true, user: { select: { email: true } } } },
        },
      }),
    ]);

    return {
      success: true,
      data: orders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },

  getOrderSlips: async (id: string) => {
    const urls = await BillingService.getSlipUrls(id);
    return { success: true, data: urls };
  },

  reviewOrder: (
    id: string,
    input: z.infer<typeof reviewOrderSchema>,
    adminId: string,
  ) => BillingService.reviewOrder(id, input.action, adminId, input.note),

  getSettings: async () => {
    const rows = await prisma.platformSetting.findMany();
    const map: Record<string, string> = { ...SETTING_DEFAULTS };
    for (const row of rows) map[row.key] = row.value;

    return {
      success: true,
      data: {
        trialEnabled: map.trialEnabled === "true",
        trialPlanId: map.trialPlanId || null,
        trialDays: Number(map.trialDays),
        graceDays: Number(map.graceDays),
        promptPayId: map.promptPayId ?? "",
        promptPayName: map.promptPayName ?? "",
        bankName: map.bankName ?? "",
        bankAccountNumber: map.bankAccountNumber ?? "",
        bankAccountName: map.bankAccountName ?? "",
        promoPricePerMonth: Number(map.promoPricePerMonth),
        promoMaxSlots: Number(map.promoMaxSlots),
        promoHoldMinutes: Number(map.promoHoldMinutes),
        enforceLimits: map.enforceLimits === "true",
        slipOkPlatformQuota: Number(map.slipOkPlatformQuota),
        // อ่านอย่างเดียว ไม่ได้บันทึกผ่าน PUT
        slipUsage: await getPlatformSlipUsage(),
      },
    };
  },

  updateSettings: async (input: SettingsInput, adminId: string) => {
    if (input.trialPlanId) {
      const plan = await prisma.plan.findUnique({
        where: { id: input.trialPlanId },
      });
      if (!plan || plan.isFree) {
        throw AppError.badRequest(
          "INVALID_TRIAL_PLAN",
          "แพ็คเกจทดลองต้องเป็นแพ็คเกจที่มีอยู่และไม่ใช่แพ็คฟรี",
        );
      }
    }

    const known = Object.values(SETTING_KEYS) as string[];
    const entries = Object.entries(input).filter(
      ([key, value]) => known.includes(key) && value !== undefined,
    );

    await prisma.$transaction(
      entries.map(([key, value]) => {
        const str = value === null ? "" : String(value);
        return prisma.platformSetting.upsert({
          where: { key },
          create: { key, value: str },
          update: { value: str },
        });
      }),
    );

    await createActivityLog({
      userId: adminId,
      action: "UPDATE_PLATFORM_SETTINGS",
      entityType: "PlatformSetting",
      metadata: { keys: entries.map(([key]) => key) },
    });

    return AdminBillingService.getSettings();
  },
};

const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;

/** รายการ period (YYYY-MM, เวลาไทย) ย้อนหลัง n เดือน เรียงจากเก่าไปใหม่ */
function lastPeriods(n: number, now = new Date()): string[] {
  const th = new Date(now.getTime() + THAI_OFFSET_MS);
  const result: string[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(th.getUTCFullYear(), th.getUTCMonth() - i, 1),
    );
    result.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }

  return result;
}

export const AdminBillingReportService = {
  getRevenueReport: async (months = 12) => {
    const now = new Date();
    const periods = lastPeriods(months, now);
    const [startY, startM] = periods[0].split("-").map(Number);
    // เริ่มต้นเดือนแรกตามเวลาไทย
    const since = new Date(Date.UTC(startY, startM - 1, 1) - THAI_OFFSET_MS);

    const [paidInRange, allTime, subs, graceDays, activePromos, maxSlots, review] =
      await Promise.all([
        prisma.billingOrder.findMany({
          where: { status: "PAID", paidAt: { gte: since } },
          select: { paidAt: true, finalAmount: true, type: true },
        }),
        prisma.billingOrder.aggregate({
          where: { status: "PAID" },
          _sum: { finalAmount: true, discountAmount: true },
          _count: true,
        }),
        prisma.subscription.findMany({
          include: { plan: { select: { id: true, name: true, priceMonthly: true } } },
        }),
        getNumberSetting(SETTING_KEYS.graceDays),
        prisma.dormPromotion.count({
          where: { status: "ACTIVE", endsAt: { gt: now } },
        }),
        getNumberSetting(SETTING_KEYS.promoMaxSlots),
        prisma.billingOrder.count({ where: { status: "PENDING_REVIEW" } }),
      ]);

    const buckets = new Map(
      periods.map((p) => [p, { period: p, plan: 0, promotion: 0, total: 0 }]),
    );

    for (const o of paidInRange) {
      if (!o.paidAt) continue;
      const th = new Date(o.paidAt.getTime() + THAI_OFFSET_MS);
      const key = `${th.getUTCFullYear()}-${String(th.getUTCMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(key);
      if (!b) continue;
      if (o.type === "PLAN") b.plan += o.finalAmount;
      else b.promotion += o.finalAmount;
      b.total += o.finalAmount;
    }

    const monthly = [...buckets.values()].map((b) => ({
      ...b,
      plan: Math.round(b.plan * 100) / 100,
      promotion: Math.round(b.promotion * 100) / 100,
      total: Math.round(b.total * 100) / 100,
    }));

    // นับสถานะจากวันที่จริง (ไม่รอ worker) เหมือน getEntitlements
    const DAY = 24 * 60 * 60 * 1000;
    const counts = { active: 0, trial: 0, grace: 0, expired: 0 };
    const byPlan = new Map<
      string,
      { planId: string; name: string; price: number; count: number }
    >();
    let mrr = 0;

    for (const s of subs) {
      if (s.status === "CANCELED") continue;
      const end = s.currentPeriodEnd;
      const live = !end || end > now;
      const inGrace =
        !live && end !== null && end.getTime() + graceDays * DAY >= now.getTime();

      if (live && s.status === "TRIAL") {
        counts.trial++;
      } else if (live) {
        counts.active++;
        mrr += s.plan.priceMonthly;
        const row = byPlan.get(s.plan.id) ?? {
          planId: s.plan.id,
          name: s.plan.name,
          price: s.plan.priceMonthly,
          count: 0,
        };
        row.count++;
        byPlan.set(s.plan.id, row);
      } else if (inGrace) {
        counts.grace++;
      } else {
        counts.expired++;
      }
    }

    const current = monthly[monthly.length - 1];
    const previous = monthly.length > 1 ? monthly[monthly.length - 2] : null;

    return {
      success: true,
      data: {
        totals: {
          allTime: allTime._sum.finalAmount ?? 0,
          discountGiven: allTime._sum.discountAmount ?? 0,
          paidOrders: allTime._count,
          thisMonth: current?.total ?? 0,
          lastMonth: previous?.total ?? 0,
        },
        monthly,
        subscriptions: {
          ...counts,
          mrr: Math.round(mrr * 100) / 100,
          byPlan: [...byPlan.values()].sort((a, b) => b.count - a.count),
        },
        promotions: { active: activePromos, maxSlots },
        pendingReview: review,
      },
    };
  },
};

export const AdminBillingTrialService = {
  /**
   * แจกทดลองฟรีให้เจ้าของหอที่อนุมัติแล้วและยังไม่เคยมีแพ็คเกจ (ใช้ก่อนเปิด "บังคับโควต้า")
   * ข้ามคนที่ถูกตัดสิทธิ์ทดลองหรือเคยใช้สิทธิ์ไปแล้ว กดซ้ำได้โดยไม่แจกซ้ำ
   */
  grantTrialToExistingOwners: async (adminId: string) => {
    const [planId, days] = await Promise.all([
      getSetting(SETTING_KEYS.trialPlanId),
      getNumberSetting(SETTING_KEYS.trialDays),
    ]);

    const plan = planId
      ? await prisma.plan.findFirst({
          where: { id: planId, isActive: true, isFree: false },
        })
      : null;

    if (!plan) {
      throw AppError.badRequest(
        "INVALID_TRIAL_PLAN",
        "ยังไม่ได้ตั้งแพ็คเกจสำหรับทดลองใช้ฟรี",
      );
    }

    const owners = await prisma.ownerProfile.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
        trialBlocked: false,
        trialUsedAt: null,
        subscription: { is: null },
      },
      select: { id: true },
    });

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    let granted = 0;

    for (const owner of owners) {
      try {
        await prisma.$transaction(async (tx) => {
          // เงื่อนไข trialUsedAt: null กันแจกซ้ำเมื่อมีคนกดรับเองพร้อมกัน
          const claimed = await tx.ownerProfile.updateMany({
            where: { id: owner.id, trialUsedAt: null },
            data: { trialUsedAt: now },
          });
          if (claimed.count === 0) return;

          await tx.subscription.create({
            data: {
              ownerId: owner.id,
              planId: plan.id,
              status: "TRIAL",
              currentPeriodStart: now,
              currentPeriodEnd: end,
              trialEndsAt: end,
            },
          });
          granted++;
        });
      } catch (error) {
        // เจ้าของคนนั้นเพิ่งมี subscription (unique ชน) ข้ามได้
        logger.warn(`grantTrial skipped owner ${owner.id}: ${error}`);
      }
    }

    await createActivityLog({
      userId: adminId,
      action: "GRANT_TRIAL_TO_EXISTING_OWNERS",
      entityType: "Subscription",
      metadata: { planId: plan.id, days, granted, candidates: owners.length },
    });

    return { success: true, data: { granted, candidates: owners.length } };
  },
};
