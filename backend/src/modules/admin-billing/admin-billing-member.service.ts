import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { getEntitlements, getUsage } from "@/lib/entitlements";
import { createActivityLog } from "@/services/activity-log.service";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { formatDateTH } from "@/utils/date";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;

// ทุกการแก้ไขโดยแอดมินต้องระบุเหตุผล เก็บไว้ใน activity log เพื่อตรวจสอบย้อนหลัง
const reason = z.string().trim().min(3).max(300);

export const subscriptionActionSchema = z.discriminatedUnion("action", [
  /** ให้แพ็คเกจ (เปลี่ยนแพ็ค/ให้พิเศษ) เริ่มนับจากตอนนี้ */
  z.object({
    action: z.literal("GRANT"),
    planId: z.string().min(1),
    days: z.number().int().min(1).max(3650),
    trial: z.boolean().optional(),
    reason,
  }),
  /** ต่อวันหมดอายุเพิ่ม N วัน (ต่อจากวันหมดเดิม หรือจากวันนี้ถ้าหมดแล้ว) */
  z.object({
    action: z.literal("EXTEND"),
    days: z.number().int().min(1).max(3650),
    reason,
  }),
  /** ตั้งวันหมดอายุเป็นวันที่กำหนด */
  z.object({
    action: z.literal("SET_END"),
    endsAt: z.string().datetime(),
    reason,
  }),
  /** ยกเลิกแพ็คเกจ (ดูข้อมูลได้อย่างเดียว) */
  z.object({ action: z.literal("CANCEL"), reason }),
]);

export const cancelPromotionSchema = z.object({ reason });
export const refundOrderSchema = z.object({ note: reason });

type OwnerForMail = {
  fullName: string;
  user: { email: string | null };
};

/** แจ้งเจ้าของหอทุกครั้งที่แอดมินเปลี่ยนสิทธิ์ (ส่งไม่สำเร็จไม่ทำให้การแก้ไขล้มเหลว) */
async function notifyOwner(
  owner: OwnerForMail,
  headline: string,
  detail: string,
) {
  const to = owner.user.email;
  if (!to) return;

  try {
    await emailQueue.add(EMAIL_JOB_NAME, {
      type: EmailType.SUBSCRIPTION_CHANGED,
      to,
      senderName: "RentFlow",
      data: {
        ownerName: owner.fullName,
        headline,
        detail,
        link: `${env.FRONTEND_URL}/owner/billing`,
      },
    });
  } catch (error) {
    logger.warn(`Admin subscription email failed (${to}): ${error}`);
  }
}

async function getOwnerOrThrow(ownerId: string) {
  const owner = await prisma.ownerProfile.findFirst({
    where: { id: ownerId, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      trialUsedAt: true,
      trialBlocked: true,
      user: { select: { email: true } },
    },
  });

  if (!owner) throw AppError.notFound("OWNER_NOT_FOUND");
  return owner;
}

export const AdminBillingMemberService = {
  /** ข้อมูลสมาชิกของเจ้าของหอรายคน: แพ็คเกจ โควต้าที่ใช้ โปรโมทที่แสดงอยู่ และคำสั่งซื้อล่าสุด */
  getOwnerSubscription: async (ownerId: string) => {
    const owner = await getOwnerOrThrow(ownerId);
    const now = new Date();

    const [sub, ent, usage, promotions, plans, orders] = await Promise.all([
      prisma.subscription.findUnique({
        where: { ownerId },
        include: { plan: true },
      }),
      getEntitlements(ownerId, prisma, { usage: false }),
      getUsage(ownerId),
      prisma.dormPromotion.findMany({
        where: { status: "ACTIVE", endsAt: { gt: now }, dorm: { ownerId } },
        orderBy: { rankAt: "asc" },
        include: { dorm: { select: { name: true } } },
      }),
      prisma.plan.findMany({
        where: { isActive: true, isFree: false },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          priceMonthly: true,
          maxDorms: true,
          maxRooms: true,
        },
      }),
      prisma.billingOrder.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          plan: { select: { name: true } },
          dorm: { select: { name: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        subscription: sub
          ? {
              id: sub.id,
              planId: sub.planId,
              planName: sub.plan.name,
              status: ent.status,
              currentPeriodStart: sub.currentPeriodStart,
              currentPeriodEnd: sub.currentPeriodEnd,
            }
          : null,
        usage,
        trial: {
          usedAt: owner.trialUsedAt,
          blocked: owner.trialBlocked,
        },
        promotions: promotions.map((p) => ({
          id: p.id,
          dormName: p.dorm.name,
          startsAt: p.startsAt,
          endsAt: p.endsAt,
        })),
        plans,
        orders: orders.map((o) => ({
          id: o.id,
          type: o.type,
          status: o.status,
          label:
            o.type === "PLAN"
              ? `แพ็คเกจ ${o.plan?.name ?? ""}`
              : `โปรโมท ${o.dorm?.name ?? ""}`,
          months: o.months,
          finalAmount: o.finalAmount,
          paidAt: o.paidAt,
          createdAt: o.createdAt,
        })),
      },
    };
  },

  updateSubscription: async (
    ownerId: string,
    input: z.infer<typeof subscriptionActionSchema>,
    adminId: string,
  ) => {
    const owner = await getOwnerOrThrow(ownerId);
    const now = new Date();

    const sub = await prisma.subscription.findUnique({
      where: { ownerId },
      include: { plan: true },
    });

    let headline = "";
    let detail = "";
    let result: { status: string; currentPeriodEnd: Date | null; planName: string };

    if (input.action === "GRANT") {
      const plan = await prisma.plan.findFirst({
        where: { id: input.planId, isFree: false },
      });
      if (!plan) {
        throw AppError.notFound("PLAN_NOT_AVAILABLE", "ไม่พบแพ็คเกจนี้");
      }

      // กันให้แพ็คเกจที่เล็กกว่าที่ใช้อยู่ จะทำให้ใช้งานต่อไม่ได้
      const used = await getUsage(ownerId);
      if (used.dorms > plan.maxDorms || used.rooms > plan.maxRooms) {
        throw AppError.badRequest(
          "PLAN_BELOW_USAGE",
          `แพ็คเกจ ${plan.name} รองรับ ${plan.maxDorms} หอ ${plan.maxRooms} ห้อง แต่เจ้าของมี ${used.dorms} หอ ${used.rooms} ห้อง`,
        );
      }

      const end = new Date(now.getTime() + input.days * DAY_MS);
      const status = input.trial ? "TRIAL" : "ACTIVE";
      const data = {
        planId: plan.id,
        status,
        currentPeriodStart: now,
        currentPeriodEnd: end,
        trialEndsAt: input.trial ? end : null,
      } as const;

      await prisma.subscription.upsert({
        where: { ownerId },
        create: { ownerId, ...data },
        update: data,
      });

      headline = "ผู้ดูแลระบบเปิดใช้งานแพ็คเกจให้ท่าน";
      detail = `แพ็คเกจ ${plan.name}${input.trial ? " (ทดลองใช้)" : ""} ใช้งานได้ถึงวันที่ ${formatDateTH(end)}`;
      result = { status, currentPeriodEnd: end, planName: plan.name };
    } else {
      if (!sub) {
        throw AppError.badRequest(
          "SUBSCRIPTION_NOT_FOUND",
          "เจ้าของหอรายนี้ยังไม่มีแพ็คเกจ ให้ใช้เมนู ให้แพ็คเกจ แทน",
        );
      }

      const lapsed = ["GRACE", "EXPIRED", "CANCELED"].includes(sub.status);
      let status = sub.status as string;
      let end = sub.currentPeriodEnd;

      if (input.action === "EXTEND") {
        const base =
          end && end.getTime() > now.getTime() ? end : now;
        end = new Date(base.getTime() + input.days * DAY_MS);
        if (lapsed) status = "ACTIVE";

        headline = "ผู้ดูแลระบบต่ออายุแพ็คเกจของท่าน";
        detail = `แพ็คเกจ ${sub.plan.name} ถูกต่ออายุ ${input.days} วัน ใช้งานได้ถึงวันที่ ${formatDateTH(end)}`;
      } else if (input.action === "SET_END") {
        end = new Date(input.endsAt);
        if (end.getTime() > now.getTime() && lapsed) status = "ACTIVE";

        headline = "ผู้ดูแลระบบปรับวันหมดอายุแพ็คเกจของท่าน";
        detail = `แพ็คเกจ ${sub.plan.name} ใช้งานได้ถึงวันที่ ${formatDateTH(end)}`;
      } else {
        if (sub.status === "CANCELED") {
          throw AppError.badRequest(
            "SUBSCRIPTION_ALREADY_CANCELED",
            "แพ็คเกจนี้ถูกยกเลิกไปแล้ว",
          );
        }
        status = "CANCELED";
        end = now;

        headline = "แพ็คเกจของท่านถูกยกเลิก";
        detail = `แพ็คเกจ ${sub.plan.name} ถูกยกเลิกโดยผู้ดูแลระบบ ท่านยังเข้าดูข้อมูลได้ แต่จะเพิ่มหอพัก ห้องพัก หรือออกบิลใหม่ไม่ได้ หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ`;
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: status as any,
          currentPeriodEnd: end,
          ...(status === "TRIAL" ? { trialEndsAt: end } : {}),
        },
      });

      result = { status, currentPeriodEnd: end, planName: sub.plan.name };
    }

    await createActivityLog({
      userId: adminId,
      action: `ADMIN_${input.action}_SUBSCRIPTION`,
      entityType: "Subscription",
      entityId: sub?.id,
      metadata: {
        ownerId,
        input,
        before: sub
          ? {
              planId: sub.planId,
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
            }
          : null,
        after: result,
      },
    });

    await notifyOwner(owner, headline, detail);

    return { success: true, data: result };
  },

  cancelPromotion: async (
    promotionId: string,
    input: z.infer<typeof cancelPromotionSchema>,
    adminId: string,
  ) => {
    const promo = await prisma.dormPromotion.findUnique({
      where: { id: promotionId },
      include: {
        dorm: {
          select: {
            name: true,
            owner: {
              select: {
                fullName: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!promo) throw AppError.notFound("PROMOTION_NOT_FOUND");
    if (promo.status !== "ACTIVE") {
      throw AppError.badRequest(
        "PROMOTION_NOT_ACTIVE",
        "การโปรโมทนี้ไม่ได้แสดงอยู่แล้ว",
      );
    }

    await prisma.dormPromotion.update({
      where: { id: promotionId },
      data: { status: "CANCELED" },
    });

    await createActivityLog({
      userId: adminId,
      action: "ADMIN_CANCEL_PROMOTION",
      entityType: "DormPromotion",
      entityId: promotionId,
      metadata: { dormId: promo.dormId, reason: input.reason },
    });

    await notifyOwner(
      promo.dorm.owner,
      "การโปรโมทหอพักของท่านถูกยกเลิก",
      `การโปรโมทหอ ${promo.dorm.name} ถูกยกเลิกโดยผู้ดูแลระบบ หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ`,
    );

    return { success: true };
  },

  /**
   * บันทึกว่าคืนเงินแล้ว (ระบบไม่ได้โอนเงินคืนให้: แอดมินโอนคืนเองก่อนแล้วจึงบันทึก)
   * ยกเลิกสิทธิ์ที่ได้จากคำสั่งซื้อนั้น ส่วนยอดจะไม่นับในรายงานรายได้เพราะไม่ใช่สถานะ PAID
   */
  refundOrder: async (
    orderId: string,
    input: z.infer<typeof refundOrderSchema>,
    adminId: string,
  ) => {
    const { order, revokedSubscription } = await prisma.$transaction(
      async (tx) => {
        const order = await tx.billingOrder.findUnique({
          where: { id: orderId },
          include: {
            plan: { select: { name: true } },
            dorm: { select: { name: true } },
            owner: {
              select: {
                fullName: true,
                user: { select: { email: true } },
              },
            },
          },
        });

        if (!order) throw AppError.notFound("ORDER_NOT_FOUND");
        if (order.status !== "PAID") {
          throw AppError.badRequest(
            "ORDER_NOT_REFUNDABLE",
            "คืนเงินได้เฉพาะคำสั่งซื้อที่ชำระแล้ว",
          );
        }

        await tx.billingOrder.update({
          where: { id: orderId },
          data: { status: "REFUNDED", note: `คืนเงินแล้ว: ${input.note}` },
        });

        let revokedSubscription = false;

        if (order.type === "PLAN") {
          // ยกเลิกแพ็คเฉพาะเมื่อใบนี้เป็นใบล่าสุดที่ให้สิทธิ์อยู่ ไม่งั้นจะตัดสิทธิ์จากใบที่ชำระภายหลัง
          const newer = await tx.billingOrder.findFirst({
            where: {
              ownerId: order.ownerId,
              type: "PLAN",
              status: "PAID",
              id: { not: order.id },
              paidAt: { gt: order.paidAt ?? new Date(0) },
            },
            select: { id: true },
          });

          const sub = await tx.subscription.findUnique({
            where: { ownerId: order.ownerId },
          });

          if (
            !newer &&
            sub &&
            sub.planId === order.planId &&
            ["ACTIVE", "TRIAL", "GRACE"].includes(sub.status)
          ) {
            await tx.subscription.update({
              where: { id: sub.id },
              data: { status: "CANCELED", currentPeriodEnd: new Date() },
            });
            revokedSubscription = true;
          }
        } else {
          await tx.dormPromotion.updateMany({
            where: { orderId, status: "ACTIVE" },
            data: { status: "CANCELED" },
          });
        }

        return { order, revokedSubscription };
      },
    );

    await createActivityLog({
      userId: adminId,
      action: "ADMIN_REFUND_ORDER",
      entityType: "BillingOrder",
      entityId: orderId,
      metadata: {
        amount: order.finalAmount,
        note: input.note,
        revokedSubscription,
      },
    });

    const label =
      order.type === "PLAN"
        ? `แพ็คเกจ ${order.plan?.name ?? ""}`
        : `โปรโมทหอ ${order.dorm?.name ?? ""}`;

    await notifyOwner(
      order.owner,
      "คำสั่งซื้อของท่านได้รับการคืนเงิน",
      `คำสั่งซื้อ ${label} จำนวน ${order.finalAmount.toLocaleString("th-TH")} บาท ได้รับการคืนเงินแล้ว สิทธิ์ที่ได้จากคำสั่งซื้อนี้สิ้นสุดลง หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ`,
    );

    return { success: true, data: { revokedSubscription } };
  },
};
