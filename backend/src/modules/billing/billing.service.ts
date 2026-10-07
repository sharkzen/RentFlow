import prisma from "@/lib/prisma";
import sharp from "sharp";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { randomUUID } from "crypto";
import {
  BillingOrder,
  BillingOrderType,
  CouponScope,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors";
import {
  SETTING_KEYS,
  getEntitlements,
  getManageAccess,
  getNumberSetting,
  isEnforced,
  isOcrAllowed,
  getSetting,
} from "@/lib/entitlements";
import {
  ALLOWED_MONTHS,
  addMonths,
  computeDiscount,
  currentPeriod,
  planPeriodPrice,
  round2,
} from "@/lib/billing-pricing";
import { slipOkService } from "@/services/slipok.service";
import { uploadFile, generateSignedUrl } from "@/services/r2Client";
import { createActivityLog } from "@/services/activity-log.service";
import { detectImageType } from "@/utils/image-type";
import { matchAccount } from "@/modules/tenant/lib/tenant.lib";
import { getSlipBankCode } from "@/utils/bank-code";
import logger from "@/utils/logger";

type Tx = Prisma.TransactionClient;

/** ล็อกเดียวสำหรับการจองช่องโปรโมท กันซื้อพร้อมกันจนเกินจำนวนช่อง */
const PROMO_LOCK_KEY = 727001;

const monthsSchema = z
  .number()
  .int()
  .refine((m) => (ALLOWED_MONTHS as readonly number[]).includes(m), {
    message: "ระยะเวลาไม่ถูกต้อง",
  })
  .default(1);

export const createOrderSchema = z
  .object({
    type: z.enum(["PLAN", "PROMOTION"]),
    planId: z.string().optional(),
    dormId: z.string().optional(),
    months: monthsSchema,
    couponCode: z.string().trim().max(40).optional(),
  })
  .refine((v) => (v.type === "PLAN" ? !!v.planId : !!v.dormId), {
    message: "ข้อมูลคำสั่งซื้อไม่ครบ",
  });

export const previewCouponSchema = z.object({
  code: z.string().trim().min(1).max(40),
  type: z.enum(["PLAN", "PROMOTION"]),
  planId: z.string().optional(),
  months: monthsSchema,
  dormId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

const SLIP_REJECT_ERRORS = [
  "SLIP_AMOUNT_MISMATCH",
  "SLIP_DUPLICATE_REF",
  "INVALID_SLIP",
];

async function getApprovedOwner(userId: string) {
  const owner = await prisma.ownerProfile.findFirst({
    where: { userId, deletedAt: null },
  });

  if (!owner) throw AppError.notFound("OWNER_NOT_FOUND", "ไม่พบข้อมูลเจ้าของหอ");
  if (owner.status !== "APPROVED") {
    throw AppError.forbidden(
      "OWNER_NOT_APPROVED",
      "บัญชีต้องได้รับการอนุมัติก่อนจึงจะซื้อแพ็คเกจได้",
    );
  }

  return owner;
}

/** บัญชีรับเงินค่าแพ็คเกจของแพลตฟอร์ม (พร้อมเพย์ และ/หรือบัญชีธนาคาร) */
async function getPayTo() {
  const [promptPayId, promptPayName, bankName, bankAccountNumber, bankAccountName] =
    await Promise.all([
      getSetting(SETTING_KEYS.promptPayId),
      getSetting(SETTING_KEYS.promptPayName),
      getSetting(SETTING_KEYS.bankName),
      getSetting(SETTING_KEYS.bankAccountNumber),
      getSetting(SETTING_KEYS.bankAccountName),
    ]);

  return {
    promptPayId: promptPayId ?? "",
    promptPayName: promptPayName ?? "",
    bankName: bankName ?? "",
    bankAccountNumber: bankAccountNumber ?? "",
    bankAccountName: bankAccountName ?? "",
  };
}

type PayTo = Awaited<ReturnType<typeof getPayTo>>;

function assertPaymentConfigured(payTo: PayTo) {
  if (!payTo.promptPayId && !payTo.bankAccountNumber) {
    throw AppError.internal(
      "PAYMENT_NOT_CONFIGURED",
      "ระบบยังไม่ได้ตั้งค่าบัญชีรับเงิน กรุณาติดต่อผู้ดูแล",
    );
  }
}

/** ผู้รับในสลิปต้องตรงกับพร้อมเพย์ หรือบัญชีธนาคารของแพลตฟอร์มอย่างใดอย่างหนึ่ง */
function isReceiverMatch(
  payTo: PayTo,
  slip: {
    receiverProxy: string | null;
    receiverAccount: string | null;
    receivingBank: string | null;
  },
) {
  if (
    payTo.promptPayId &&
    (matchAccount(payTo.promptPayId, slip.receiverProxy) ||
      matchAccount(payTo.promptPayId, slip.receiverAccount))
  ) {
    return true;
  }

  if (
    payTo.bankAccountNumber &&
    matchAccount(payTo.bankAccountNumber, slip.receiverAccount)
  ) {
    // เลขบัญชีในสลิปถูกปิดบังบางหลัก จึงเทียบรหัสธนาคารผู้รับเพิ่มเมื่อรู้ทั้งสองฝั่ง
    const expectedBank = getSlipBankCode(payTo.bankName);
    return !expectedBank || !slip.receivingBank || expectedBank === slip.receivingBank;
  }

  return false;
}

async function lockPromotions(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${PROMO_LOCK_KEY})`;
}

/** ช่องที่ถูกใช้: โปรโมทที่ยังไม่หมดอายุ + คำสั่งซื้อที่จองช่องไว้หรือรอแอดมินตรวจ */
async function countSlotsUsed(
  tx: Tx,
  exclude: { orderId?: string; dormId?: string } = {},
) {
  const now = new Date();

  const [active, holds] = await Promise.all([
    tx.dormPromotion.count({
      where: {
        status: "ACTIVE",
        endsAt: { gt: now },
        ...(exclude.dormId ? { dormId: { not: exclude.dormId } } : {}),
        ...(exclude.orderId ? { orderId: { not: exclude.orderId } } : {}),
      },
    }),
    tx.billingOrder.count({
      where: {
        type: "PROMOTION",
        OR: [
          { status: "PENDING", holdUntil: { gt: now } },
          { status: "PENDING_REVIEW" },
        ],
        ...(exclude.dormId ? { dormId: { not: exclude.dormId } } : {}),
        ...(exclude.orderId ? { id: { not: exclude.orderId } } : {}),
      },
    }),
  ]);

  return active + holds;
}

async function validateCoupon(
  db: Tx | typeof prisma,
  params: {
    code: string;
    ownerId: string;
    scope: Exclude<CouponScope, "BOTH">;
    planId?: string | null;
  },
) {
  const coupon = await db.coupon.findUnique({
    where: { code: params.code.trim().toUpperCase() },
  });

  const invalid = (message = "คูปองไม่ถูกต้องหรือใช้ไม่ได้") =>
    AppError.badRequest("COUPON_INVALID", message);

  if (!coupon || !coupon.isActive) throw invalid();

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw invalid("คูปองยังไม่เริ่มใช้งาน");
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    throw invalid("คูปองหมดอายุแล้ว");
  }
  if (coupon.appliesTo !== "BOTH" && coupon.appliesTo !== params.scope) {
    throw invalid("คูปองนี้ใช้กับสินค้าประเภทนี้ไม่ได้");
  }
  if (
    params.scope === "PLAN" &&
    coupon.planIds.length > 0 &&
    (!params.planId || !coupon.planIds.includes(params.planId))
  ) {
    throw invalid("คูปองนี้ใช้กับแพ็คเกจนี้ไม่ได้");
  }

  const [total, byOwner] = await Promise.all([
    db.couponRedemption.count({ where: { couponId: coupon.id } }),
    db.couponRedemption.count({
      where: { couponId: coupon.id, ownerId: params.ownerId },
    }),
  ]);

  if (coupon.maxRedemptions !== null && total >= coupon.maxRedemptions) {
    throw invalid("คูปองถูกใช้ครบจำนวนแล้ว");
  }
  if (byOwner >= coupon.perOwnerLimit) {
    throw invalid("คุณใช้คูปองนี้ครบสิทธิ์แล้ว");
  }

  return coupon;
}

/**
 * เปิดสิทธิ์หลังชำระเงิน ต้องเรียกใน transaction เดียวกับการเปลี่ยนสถานะ order
 * คืน PENDING_REVIEW ถ้าช่องโปรโมทเต็มไปแล้ว (ต้องให้แอดมินตัดสิน/คืนเงิน)
 */
async function fulfillOrder(
  tx: Tx,
  order: BillingOrder,
): Promise<"PAID" | "PENDING_REVIEW"> {
  const now = new Date();

  if (order.type === "PLAN") {
    if (!order.planId) throw AppError.internal("ORDER_PLAN_MISSING");

    const sub = await tx.subscription.findUnique({
      where: { ownerId: order.ownerId },
    });

    // ต่ออายุแพ็คเดิมต่อจากวันหมดอายุ ส่วนเปลี่ยนแพ็ค/หลังหมดอายุ/หลังทดลอง เริ่มนับจากตอนนี้
    const canExtend =
      !!sub &&
      sub.status === "ACTIVE" &&
      sub.planId === order.planId &&
      !!sub.currentPeriodEnd &&
      sub.currentPeriodEnd > now;

    const start = canExtend ? sub!.currentPeriodEnd! : now;
    const end = addMonths(start, order.months);

    await tx.subscription.upsert({
      where: { ownerId: order.ownerId },
      create: {
        ownerId: order.ownerId,
        planId: order.planId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
      update: {
        planId: order.planId,
        status: "ACTIVE",
        currentPeriodStart: canExtend ? sub!.currentPeriodStart : now,
        currentPeriodEnd: end,
        trialEndsAt: null,
      },
    });
  } else {
    if (!order.dormId) throw AppError.internal("ORDER_DORM_MISSING");

    await lockPromotions(tx);

    const maxSlots = await getNumberSetting(SETTING_KEYS.promoMaxSlots, tx);
    const used = await countSlotsUsed(tx, { orderId: order.id });

    if (used >= maxSlots) return "PENDING_REVIEW";

    await tx.dormPromotion.create({
      data: {
        dormId: order.dormId,
        orderId: order.id,
        startsAt: now,
        endsAt: addMonths(now, order.months),
        rankAt: now,
        status: "ACTIVE",
      },
    });
  }

  if (order.couponId) {
    await tx.couponRedemption.create({
      data: {
        couponId: order.couponId,
        ownerId: order.ownerId,
        orderId: order.id,
      },
    });
  }

  return "PAID";
}

async function assertRealImage(fileBuffer: Buffer) {
  // ตรวจจากเนื้อไฟล์จริง ไม่เชื่อ mimetype ที่ client ส่งมา (เหมือนการตรวจสลิปผู้เช่า)
  const detected = detectImageType(fileBuffer);
  const formatByMime = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };

  let realFormat: string | undefined;
  try {
    realFormat = (await sharp(fileBuffer).metadata()).format;
  } catch {
    realFormat = undefined;
  }

  if (!detected || formatByMime[detected.mime] !== realFormat) {
    throw AppError.badRequest(
      "INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED",
      "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP",
    );
  }

  return detected;
}

export const BillingService = {
  listPlans: async () => {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isFree: false },
      orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
    });

    return { success: true, data: plans };
  },

  /** ข้อมูลหน้า pricing สาธารณะ: ไม่ต้องล็อกอิน และไม่เปิดเผยข้อมูลเจ้าของหอ */
  getPublicPricing: async () => {
    const [plans, promoPrice, promoMaxSlots, trialEnabled, trialPlanId, trialDays] =
      await Promise.all([
        prisma.plan.findMany({
          where: { isActive: true, isFree: false },
          orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
          select: {
            id: true,
            name: true,
            description: true,
            priceMonthly: true,
            maxDorms: true,
            maxRooms: true,
            slipQuotaMonthly: true,
            slipUnlimited: true,
            hasOcr: true,
            discountPct3m: true,
            discountPct6m: true,
            discountPct12m: true,
          },
        }),
        getNumberSetting(SETTING_KEYS.promoPricePerMonth),
        getNumberSetting(SETTING_KEYS.promoMaxSlots),
        getSetting(SETTING_KEYS.trialEnabled),
        getSetting(SETTING_KEYS.trialPlanId),
        getNumberSetting(SETTING_KEYS.trialDays),
      ]);

    const trialPlan =
      trialEnabled === "true" && trialPlanId
        ? await prisma.plan.findFirst({
            where: { id: trialPlanId, isActive: true, allowTrial: true },
            select: { name: true },
          })
        : null;

    return {
      success: true,
      data: {
        plans,
        promotion: { pricePerMonth: promoPrice, maxSlots: promoMaxSlots },
        trial: trialPlan ? { planName: trialPlan.name, days: trialDays } : null,
      },
    };
  },

  getMyBilling: async (userId: string) => {
    const owner = await prisma.ownerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!owner) throw AppError.notFound("OWNER_NOT_FOUND");

    const [ent, usage, trialEnabled, trialPlanId, price, maxSlots] =
      await Promise.all([
        getEntitlements(owner.id),
        prisma.slipUsage.findUnique({
          where: {
            ownerId_period: { ownerId: owner.id, period: currentPeriod() },
          },
        }),
        getSetting(SETTING_KEYS.trialEnabled),
        getSetting(SETTING_KEYS.trialPlanId),
        getNumberSetting(SETTING_KEYS.promoPricePerMonth),
        getNumberSetting(SETTING_KEYS.promoMaxSlots),
      ]);

    const trialPlan = trialPlanId
      ? await prisma.plan.findFirst({
          where: { id: trialPlanId, isActive: true, allowTrial: true },
        })
      : null;

    const [slotsUsed, myPromotions] = await Promise.all([
      prisma.$transaction((tx) => countSlotsUsed(tx)),
      prisma.dormPromotion.findMany({
        where: {
          status: "ACTIVE",
          endsAt: { gt: new Date() },
          dorm: { ownerId: owner.id },
        },
        include: { dorm: { select: { id: true, name: true } } },
        orderBy: { endsAt: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        status: ent.status,
        canManage: ent.canManage,
        readOnly: ent.readOnly,
        ocrAllowed: await isOcrAllowed(owner.id),
        plan: ent.plan,
        periodEnd: ent.periodEnd,
        graceEndsAt: ent.graceEndsAt,
        usage: {
          dorms: ent.usage.dorms,
          rooms: ent.usage.rooms,
          slips: usage?.count ?? 0,
        },
        trial:
          trialEnabled === "true" &&
          !owner.trialUsedAt &&
          !owner.trialBlocked &&
          trialPlan
            ? {
                available: true,
                planName: trialPlan.name,
                days: await getNumberSetting(SETTING_KEYS.trialDays),
              }
            : { available: false },
        promotion: {
          pricePerMonth: price,
          maxSlots,
          slotsAvailable: Math.max(0, maxSlots - slotsUsed),
          active: myPromotions.map((p) => ({
            id: p.id,
            dormId: p.dorm.id,
            dormName: p.dorm.name,
            endsAt: p.endsAt,
          })),
        },
        trialBlocked: owner.trialBlocked,
        enforced: await isEnforced(),
        access: await getManageAccess(owner.id),
        payTo: await getPayTo(),
      },
    };
  },

  previewCoupon: async (
    userId: string,
    input: z.infer<typeof previewCouponSchema>,
  ) => {
    const owner = await getApprovedOwner(userId);

    let base: number;
    if (input.type === "PLAN") {
      if (!input.planId) throw AppError.badRequest("PLAN_REQUIRED");
      const plan = await prisma.plan.findFirst({
        where: { id: input.planId, isActive: true, isFree: false },
      });
      if (!plan) throw AppError.notFound("PLAN_NOT_AVAILABLE");
      base = planPeriodPrice(plan, input.months);
    } else {
      base = round2(
        (await getNumberSetting(SETTING_KEYS.promoPricePerMonth)) *
          input.months,
      );
    }

    const coupon = await validateCoupon(prisma, {
      code: input.code,
      ownerId: owner.id,
      scope: input.type,
      planId: input.planId,
    });

    const discount = computeDiscount(coupon, base);

    return {
      success: true,
      data: {
        code: coupon.code,
        baseAmount: base,
        discountAmount: discount,
        finalAmount: round2(base - discount),
      },
    };
  },

  createOrder: async (userId: string, input: CreateOrderInput) => {
    const owner = await getApprovedOwner(userId);

    if (input.type === "PLAN") {
      const plan = await prisma.plan.findFirst({
        where: { id: input.planId, isActive: true, isFree: false },
      });
      if (!plan) {
        throw AppError.notFound("PLAN_NOT_AVAILABLE", "แพ็คเกจนี้ไม่เปิดขาย");
      }

      const order = await prisma.$transaction(async (tx) => {
        const coupon = input.couponCode
          ? await validateCoupon(tx, {
              code: input.couponCode,
              ownerId: owner.id,
              scope: "PLAN",
              planId: plan.id,
            })
          : null;

        const base = planPeriodPrice(plan, input.months);
        const discount = computeDiscount(coupon, base);
        const finalAmount = round2(base - discount);

        // คำสั่งซื้อแพ็คที่ยังไม่จ่ายอันเก่าเลิกใช้ เหลืออันล่าสุดอันเดียว
        await tx.billingOrder.updateMany({
          where: { ownerId: owner.id, type: "PLAN", status: "PENDING" },
          data: { status: "EXPIRED", note: "แทนที่ด้วยคำสั่งซื้อใหม่" },
        });

        const created = await tx.billingOrder.create({
          data: {
            ownerId: owner.id,
            type: "PLAN",
            planId: plan.id,
            months: input.months,
            baseAmount: base,
            discountAmount: discount,
            finalAmount,
            couponId: coupon?.id ?? null,
          },
        });

        // คูปองลด 100% ไม่ต้องโอนเงิน เปิดสิทธิ์ทันที
        if (finalAmount <= 0) {
          await fulfillOrder(tx, created);
          return tx.billingOrder.update({
            where: { id: created.id },
            data: { status: "PAID", paidAt: new Date() },
          });
        }

        return created;
      });

      return { success: true, data: order };
    }

    const dorm = await prisma.dormitory.findFirst({
      where: {
        id: input.dormId,
        ownerId: owner.id,
        deletedAt: null,
        status: "ACTIVE",
        isPublished: true,
      },
    });
    if (!dorm) {
      throw AppError.badRequest(
        "DORM_NOT_PROMOTABLE",
        "โปรโมทได้เฉพาะหอพักที่อนุมัติแล้วและเผยแพร่อยู่",
      );
    }

    const [pricePerMonth, maxSlots, holdMinutes] = await Promise.all([
      getNumberSetting(SETTING_KEYS.promoPricePerMonth),
      getNumberSetting(SETTING_KEYS.promoMaxSlots),
      getNumberSetting(SETTING_KEYS.promoHoldMinutes),
    ]);

    const order = await prisma.$transaction(async (tx) => {
      await lockPromotions(tx);

      const now = new Date();

      const alreadyActive = await tx.dormPromotion.findFirst({
        where: { dormId: dorm.id, status: "ACTIVE", endsAt: { gt: now } },
      });
      if (alreadyActive) {
        throw AppError.conflict(
          "PROMOTION_ALREADY_ACTIVE",
          "หอนี้กำลังโปรโมทอยู่ ซื้อใหม่ได้เมื่อหมดเวลา",
        );
      }

      const inReview = await tx.billingOrder.findFirst({
        where: { dormId: dorm.id, type: "PROMOTION", status: "PENDING_REVIEW" },
      });
      if (inReview) {
        throw AppError.conflict(
          "PROMOTION_IN_REVIEW",
          "หอนี้มีคำสั่งซื้อที่รอแอดมินตรวจสอบอยู่",
        );
      }

      // คำสั่งซื้อค้างเดิมของหอนี้เลิกใช้ เพื่อจองช่องใหม่แทน
      await tx.billingOrder.updateMany({
        where: {
          dormId: dorm.id,
          type: "PROMOTION",
          status: "PENDING",
        },
        data: { status: "EXPIRED", note: "แทนที่ด้วยคำสั่งซื้อใหม่" },
      });

      const used = await countSlotsUsed(tx);
      if (used >= maxSlots) {
        throw AppError.conflict(
          "PROMOTION_SLOTS_FULL",
          "ช่องโปรโมทเต็มแล้ว กรุณารอจนกว่าจะมีหอหมดเวลา",
        );
      }

      const coupon = input.couponCode
        ? await validateCoupon(tx, {
            code: input.couponCode,
            ownerId: owner.id,
            scope: "PROMOTION",
          })
        : null;

      const base = round2(pricePerMonth * input.months);
      const discount = computeDiscount(coupon, base);
      const finalAmount = round2(base - discount);

      const created = await tx.billingOrder.create({
        data: {
          ownerId: owner.id,
          type: "PROMOTION",
          dormId: dorm.id,
          months: input.months,
          baseAmount: base,
          discountAmount: discount,
          finalAmount,
          couponId: coupon?.id ?? null,
          holdUntil: new Date(now.getTime() + holdMinutes * 60 * 1000),
        },
      });

      if (finalAmount <= 0) {
        const result = await fulfillOrder(tx, created);
        return tx.billingOrder.update({
          where: { id: created.id },
          data: {
            status: result,
            paidAt: result === "PAID" ? new Date() : null,
          },
        });
      }

      return created;
    });

    return { success: true, data: order };
  },

  listOrders: async (userId: string) => {
    const owner = await getApprovedOwner(userId);

    const orders = await prisma.billingOrder.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        plan: { select: { name: true } },
        dorm: { select: { name: true } },
      },
    });

    return { success: true, data: orders };
  },

  /** รายละเอียดคำสั่งซื้อสำหรับหน้าสรุป/ชำระเงิน: ยอด ส่วนลด บัญชีรับเงิน QR และสลิปที่แนบแล้ว */
  getOrder: async (userId: string, orderId: string) => {
    const owner = await getApprovedOwner(userId);

    const order = await prisma.billingOrder.findFirst({
      where: { id: orderId, ownerId: owner.id },
      include: {
        plan: true,
        dorm: { select: { id: true, name: true } },
        coupon: { select: { code: true } },
        slips: { select: { id: true, objectKey: true } },
      },
    });
    if (!order) throw AppError.notFound("ORDER_NOT_FOUND");

    const payTo = await getPayTo();

    let qr: string | null = null;
    if (order.status === "PENDING" && payTo.promptPayId) {
      const payload = generatePayload(payTo.promptPayId, {
        amount: order.finalAmount,
      });
      qr = await QRCode.toDataURL(payload);
    }

    // baseAmount ของแพ็คเกจคือราคาหลังหักส่วนลดตามระยะเวลาแล้ว จึงย้อนหาราคาเต็มเพื่อแสดงยอดที่ประหยัด
    const listPrice =
      order.type === "PLAN" && order.plan
        ? order.plan.priceMonthly * order.months
        : order.baseAmount;

    const slipUrls = await Promise.all(
      order.slips.map((f) => generateSignedUrl(f.objectKey, 600)),
    );

    const { slips: _slips, ...rest } = order;

    return {
      success: true,
      data: {
        order: {
          ...rest,
          listPrice,
          termDiscount: Math.max(0, listPrice - order.baseAmount),
          couponCode: order.coupon?.code ?? null,
          slipUrls,
        },
        payTo,
        qr,
      },
    };
  },

  cancelOrder: async (userId: string, orderId: string) => {
    const owner = await getApprovedOwner(userId);

    const result = await prisma.billingOrder.updateMany({
      where: { id: orderId, ownerId: owner.id, status: "PENDING" },
      data: { status: "EXPIRED", note: "ยกเลิกโดยผู้ใช้" },
    });

    if (result.count === 0) {
      throw AppError.notFound(
        "ORDER_NOT_FOUND",
        "ไม่พบคำสั่งซื้อที่ยกเลิกได้",
      );
    }

    return { success: true };
  },

  claimTrial: async (userId: string) => {
    const owner = await getApprovedOwner(userId);

    if (owner.trialBlocked) {
      throw AppError.badRequest(
        "TRIAL_NOT_AVAILABLE",
        "บัญชีนี้ไม่มีสิทธิ์ทดลองใช้ฟรี",
      );
    }

    const [enabled, planId, days] = await Promise.all([
      getSetting(SETTING_KEYS.trialEnabled),
      getSetting(SETTING_KEYS.trialPlanId),
      getNumberSetting(SETTING_KEYS.trialDays),
    ]);

    if (enabled !== "true" || !planId) {
      throw AppError.badRequest("TRIAL_NOT_AVAILABLE", "ขณะนี้ไม่มีสิทธิ์ทดลองใช้");
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, isActive: true, allowTrial: true, isFree: false },
    });
    if (!plan) {
      throw AppError.badRequest("TRIAL_NOT_AVAILABLE", "ขณะนี้ไม่มีสิทธิ์ทดลองใช้");
    }

    const existing = await prisma.subscription.findUnique({
      where: { ownerId: owner.id },
    });
    if (existing) {
      throw AppError.badRequest(
        "TRIAL_NOT_AVAILABLE",
        "บัญชีที่เคยมีแพ็คเกจแล้วไม่สามารถทดลองใช้ได้",
      );
    }

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // updateMany เงื่อนไข trialUsedAt: null ทำให้กดซ้ำพร้อมกันได้สิทธิ์ครั้งเดียว
      const claimed = await tx.ownerProfile.updateMany({
        where: { id: owner.id, trialUsedAt: null },
        data: { trialUsedAt: now },
      });
      if (claimed.count === 0) {
        throw AppError.badRequest(
          "TRIAL_ALREADY_USED",
          "คุณใช้สิทธิ์ทดลองไปแล้ว",
        );
      }

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
    });

    await createActivityLog({
      userId,
      action: "CLAIM_TRIAL",
      entityType: "Subscription",
      entityId: owner.id,
      metadata: { planId: plan.id, days },
    });

    return { success: true, data: { planName: plan.name, endsAt: end } };
  },

  submitSlip: async (
    userId: string,
    orderId: string,
    fileBuffer: Buffer,
  ) => {
    const owner = await getApprovedOwner(userId);

    const order = await prisma.billingOrder.findFirst({
      where: { id: orderId, ownerId: owner.id },
    });
    if (!order) throw AppError.notFound("ORDER_NOT_FOUND");
    if (order.status !== "PENDING") {
      throw AppError.badRequest(
        "ORDER_NOT_PAYABLE",
        "คำสั่งซื้อนี้ชำระหรือหมดอายุไปแล้ว",
      );
    }

    const payTo = await getPayTo();
    assertPaymentConfigured(payTo);

    const image = await assertRealImage(fileBuffer);

    // ใบสั่งซื้อโปรโมทที่หมดเวลาจองต้องมีช่องว่างจึงจะรับสลิปต่อได้
    if (
      order.type === "PROMOTION" &&
      order.holdUntil &&
      order.holdUntil < new Date()
    ) {
      await prisma.$transaction(async (tx) => {
        await lockPromotions(tx);
        const maxSlots = await getNumberSetting(SETTING_KEYS.promoMaxSlots, tx);
        const used = await countSlotsUsed(tx, { orderId: order.id });

        if (used >= maxSlots) {
          throw AppError.conflict(
            "PROMOTION_HOLD_EXPIRED",
            "หมดเวลาจองช่องและช่องเต็มแล้ว กรุณาติดต่อผู้ดูแลหากโอนเงินไปแล้ว",
          );
        }

        const holdMinutes = await getNumberSetting(
          SETTING_KEYS.promoHoldMinutes,
          tx,
        );
        await tx.billingOrder.update({
          where: { id: order.id },
          data: { holdUntil: new Date(Date.now() + holdMinutes * 60 * 1000) },
        });
      });
    }

    let verified: Awaited<ReturnType<typeof slipOkService.verifySlip>> | null =
      null;

    try {
      verified = await slipOkService.verifySlip(fileBuffer, order.finalAmount);
    } catch (error: any) {
      if (SLIP_REJECT_ERRORS.includes(error?.message)) {
        throw AppError.badRequest(error.message);
      }

      logger.error(
        `Billing slip verification unavailable, manual review: OrderId=${order.id}, Reason=${error?.message}`,
      );
    }

    if (verified?.refNo) {
      const [usedByOrder, usedByTenant] = await Promise.all([
        prisma.billingOrder.findUnique({
          where: { transferRef: verified.refNo },
        }),
        prisma.payment.findUnique({
          where: { transferRef: verified.refNo },
        }),
      ]);

      if ((usedByOrder && usedByOrder.id !== order.id) || usedByTenant) {
        throw AppError.badRequest("SLIP_DUPLICATE_REF");
      }
    }

    let autoApprove = false;

    if (verified) {
      const amountOk = Math.abs(verified.amount - order.finalAmount) < 0.5;
      const receiverOk = isReceiverMatch(payTo, verified);

      // สลิปต้องโอนหลังสร้างคำสั่งซื้อ และไม่ใช่เวลาในอนาคต
      const paidAtMs = verified.paidAt?.getTime?.();
      const dateOk =
        Number.isFinite(paidAtMs) &&
        paidAtMs! >= order.createdAt.getTime() &&
        paidAtMs! <= Date.now() + 10 * 60 * 1000;

      autoApprove = amountOk && receiverOk && dateOk;

      if (!autoApprove) {
        logger.warn(
          `Billing slip needs review: OrderId=${order.id}, amountOk=${amountOk}, receiverOk=${receiverOk}, dateOk=${dateOk}`,
        );
      }
    }

    const objectKey = `billing-slips/${owner.id}/${randomUUID()}.${image.extension}`;
    await uploadFile(fileBuffer, objectKey, image.mime);

    let finalStatus: "PAID" | "PENDING_REVIEW";

    try {
      finalStatus = await prisma.$transaction(async (tx) => {
        let status: "PAID" | "PENDING_REVIEW" = "PENDING_REVIEW";

        if (autoApprove) {
          status = await fulfillOrder(tx, order);
        }

        await tx.billingOrder.update({
          where: { id: order.id },
          data: {
            status,
            transferRef: verified?.refNo ?? null,
            paidAt: status === "PAID" ? new Date() : null,
            note:
              status === "PENDING_REVIEW" && autoApprove
                ? "ช่องโปรโมทเต็มหลังชำระ รอแอดมินตรวจสอบ"
                : null,
          },
        });

        await tx.file.create({
          data: {
            bucket: env.BUCKET_NAME || env.BUCKET,
            objectKey,
            mimeType: image.mime,
            size: fileBuffer.length,
            category: "BILLING_SLIP",
            ownerId: owner.id,
            billingOrderId: order.id,
          },
        });

        return status;
      });
    } catch (error: any) {
      // transferRef ซ้ำจากการส่งสลิปเดียวกันพร้อมกัน
      if (error?.code === "P2002") {
        throw AppError.badRequest("SLIP_DUPLICATE_REF");
      }
      throw error;
    }

    await createActivityLog({
      userId,
      action:
        finalStatus === "PAID" ? "BILLING_ORDER_PAID" : "BILLING_ORDER_REVIEW",
      entityType: "BillingOrder",
      entityId: order.id,
      metadata: { type: order.type, amount: order.finalAmount },
    });

    return { success: true, data: { status: finalStatus } };
  },

  /** สำหรับแอดมิน: อนุมัติ/ปฏิเสธคำสั่งซื้อที่รอตรวจ */
  reviewOrder: async (
    orderId: string,
    action: "APPROVE" | "REJECT",
    adminId: string,
    note?: string,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.billingOrder.findUnique({
        where: { id: orderId },
      });
      if (!order) throw AppError.notFound("ORDER_NOT_FOUND");
      if (order.status !== "PENDING_REVIEW") {
        throw AppError.badRequest(
          "ORDER_NOT_IN_REVIEW",
          "คำสั่งซื้อนี้ไม่ได้อยู่ระหว่างรอตรวจสอบ",
        );
      }

      if (action === "REJECT") {
        await tx.billingOrder.update({
          where: { id: orderId },
          data: { status: "REJECTED", note: note ?? null },
        });
        return "REJECTED" as const;
      }

      const status = await fulfillOrder(tx, order);
      if (status === "PENDING_REVIEW") {
        throw AppError.conflict(
          "PROMOTION_SLOTS_FULL",
          "ช่องโปรโมทเต็ม อนุมัติไม่ได้ ปฏิเสธและคืนเงินแทน",
        );
      }

      await tx.billingOrder.update({
        where: { id: orderId },
        data: { status: "PAID", paidAt: new Date(), note: note ?? null },
      });
      return "PAID" as const;
    });

    await createActivityLog({
      userId: adminId,
      action: action === "APPROVE" ? "APPROVE_BILLING_ORDER" : "REJECT_BILLING_ORDER",
      entityType: "BillingOrder",
      entityId: orderId,
    });

    return { success: true, data: { status: result } };
  },

  getSlipUrls: async (orderId: string) => {
    const files = await prisma.file.findMany({
      where: { billingOrderId: orderId, category: "BILLING_SLIP" },
    });

    return Promise.all(files.map((f) => generateSignedUrl(f.objectKey, 600)));
  },
};

export type { BillingOrderType };
