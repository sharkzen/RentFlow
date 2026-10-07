import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { SETTING_DEFAULTS, SETTING_KEYS } from "@/lib/entitlements";
import { createActivityLog } from "@/services/activity-log.service";
import { z } from "zod";

export const planSchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(300).nullable().optional(),
  priceMonthly: z.number().min(0),
  maxDorms: z.number().int().min(0),
  maxRooms: z.number().int().min(0),
  slipQuotaMonthly: z.number().int().min(0),
  slipOverageRate: z.number().min(0).nullable().optional(),
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
  promoPricePerMonth: z.number().min(0).optional(),
  promoMaxSlots: z.number().int().min(0).optional(),
  promoHoldMinutes: z.number().int().min(5).max(1440).optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

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
        promoPricePerMonth: Number(map.promoPricePerMonth),
        promoMaxSlots: Number(map.promoMaxSlots),
        promoHoldMinutes: Number(map.promoHoldMinutes),
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
