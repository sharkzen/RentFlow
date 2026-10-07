import prisma from "@/lib/prisma";
import { CreateBillDto, GetBillsQueryDto } from "./dto/bill.dto";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import {
  BillStatus,
  Bill,
  FileCategory,
  PaymentStatus,
  PaymentMethod,
} from "@prisma/client";
import { env } from "@/config/env";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  r2Client,
  deleteFile,
  uploadFile,
  generateSignedUrl,
} from "@/services/r2Client";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { createActivityLog } from "@/services/activity-log.service";
import sharp from "sharp";
import { moveTempFileToPermanent } from "@/services/r2Client";
import { formatDateTH } from "@/utils/date";
import * as fs from "fs";
import * as path from "path";
import { buildBulkBillHtmlTemplate } from "../owner/lib/owner.lib";
import { createPdfFromHtml, getCachedStamps } from "../tenant/lib/tenant.lib";
import { assertCanUseOcr } from "@/lib/entitlements";

// OCR หลาย pass บน CPU อาจใช้เวลาหลายวินาทีตอนคิวแน่น แต่ไม่ควรค้างนานกว่านี้
const OCR_REQUEST_TIMEOUT_MS = 15_000;
// จำนวนบิลย้อนหลังที่ใช้หาค่าเฉลี่ยการใช้งานของห้อง
const OCR_USAGE_HISTORY_MONTHS = 6;
// ใช้งานเกินค่าเฉลี่ยกี่เท่าถึงถือว่าผิดปกติ
const OCR_USAGE_SPIKE_FACTOR = 3;

interface OcrScanResponse {
  review_reasons?: string[];
  rolling_digits?: { index: number; estimate: string | null; applied: boolean }[];
  uncertain_digits?: { index: number; line: string; single: string }[];
  alternative?: string | null;
}

// แปลงเหตุผลที่ OCR service ไม่มั่นใจ เป็นข้อความภาษาไทยให้ผู้ใช้เข้าใจว่าต้องดูตรงไหน
function ocrReviewMessages(data: OcrScanResponse, number: string): string[] {
  const reasons = new Set(data.review_reasons ?? []);
  const messages: string[] = [];

  if (reasons.has("ROLLING_DIGIT")) {
    const applied = (data.rolling_digits ?? []).find((r) => r.applied);
    messages.push(
      applied
        ? `หลักที่ ${applied.index + 1} กำลังหมุนค้างระหว่างเลข ระบบประมาณเป็น ${applied.estimate}`
        : "มีหลักที่กำลังหมุนค้างระหว่างเลข",
    );
  }

  for (const u of data.uncertain_digits ?? []) {
    messages.push(`ไม่แน่ใจหลักที่ ${u.index + 1} (อาจเป็น ${u.line} หรือ ${u.single})`);
  }

  if (reasons.has("AMBIGUOUS") && data.alternative && data.alternative !== number) {
    messages.push(`ระบบลังเลระหว่าง ${number} กับ ${data.alternative}`);
  }

  if (reasons.has("LOW_CONFIDENCE") && messages.length === 0) {
    messages.push("ภาพไม่ชัด ระบบไม่มั่นใจตัวเลขที่อ่านได้");
  }

  return messages;
}

export const billService = {
  getBills: async ({
    dormId,
    sub,
    page = 1,
    limit = 10,
    search,
    status,
    month,
  }: GetBillsQueryDto) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const skip = (page - 1) * limit;

    const where: any = {
      archived: false,
    };

    const roomFilter: any = {
      dormitory: {
        ownerId: owner.id,
      },
    };

    if (dormId && dormId !== "ALL") {
      roomFilter.dormitoryId = dormId;
    }

    if (search) {
      roomFilter.roomNumber = {
        contains: search,
      };
    }

    where.room = roomFilter;

    if (status && (status as string) !== "ALL") {
      where.status = status;
    }

    if (month) {
      const startDate = new Date(month);
      const endDate = new Date(
        new Date(month).setMonth(startDate.getMonth() + 1),
      );

      where.billingMonth = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [items, total] = await Promise.all([
      prisma.bill.findMany({
        where,

        include: {
          room: {
            include: {
              dormitory: {
                select: {
                  name: true,

                  settings: {
                    select: {
                      lateFee: true,
                    },
                  },
                },
              },
            },
          },

          items: true,

          tenant: {
            select: {
              firstName: true,
              lastName: true,
              advancePayment: true,
            },
          },

          payment: {
            include: {
              slips: true,
            },
          },
        },

        orderBy: [
          {
            billingMonth: "desc",
          },
          {
            room: {
              roomNumber: "asc",
            },
          },
        ],

        skip,
        take: Number(limit),
      }),
      prisma.bill.count({
        where,
      }),
    ]);

    const itemsWithSignedUrl = await Promise.all(
      items.map(async (bill) => {
        const today = new Date();

        if (
          bill.status !== "PAID" &&
          bill.status !== "CANCELLED" &&
          today > new Date(bill.dueDate)
        ) {
          const dailyRate = (bill.room as any).dormitory.settings?.lateFee || 0;
          const dueDate = new Date(bill.dueDate);
          const startDate = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth(),
            dueDate.getDate(),
          );
          const endDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const daysLate = Math.floor(
            (endDate.getTime() - startDate.getTime()) / 86400000,
          );
          const calculatedLateFee = Math.max(daysLate, 0) * dailyRate;

          if (calculatedLateFee > bill.lateFeeSnapshot) {
            const feeDifference = calculatedLateFee - bill.lateFeeSnapshot;

            const updated = await prisma.bill.update({
              where: {
                id: bill.id,
              },

              data: {
                lateFeeSnapshot: calculatedLateFee,

                total: {
                  increment: feeDifference,
                },

                status: "OVERDUE",
              },
            });

            bill.lateFeeSnapshot = updated.lateFeeSnapshot;
            bill.total = updated.total;
            bill.status = updated.status;
          } else if (bill.status === "PENDING") {
            bill.status = "OVERDUE" as any;
          }
        }

        if (!bill.payment || !bill.payment.slips.length) return bill;

        const slipsWithUrl = await Promise.all(
          bill.payment.slips.map(async (file) => ({
            ...file,
            url: await generateSignedUrl(file.objectKey),
          })),
        );

        return {
          ...bill,

          payment: {
            ...bill.payment,
            slips: slipsWithUrl,
          },
        };
      }),
    );

    return {
      items: itemsWithSignedUrl,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  },

  addBillItem: async (
    userSub: string,
    billId: string,
    data: {
      name: string;
      amount: number;
      type: "CHARGE" | "DISCOUNT";
    },
  ) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    return await prisma.$transaction(async (tx) => {
      const newItem = await tx.billItem.create({
        data: {
          billId: billId,
          name: data.name,
          amount: Number(data.amount),
          type: data.type,
        },
      });

      const amountChange =
        data.type === "CHARGE" ? Number(data.amount) : -Number(data.amount);
      const newTotal = bill.total + amountChange;

      const updatedBill = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          total: newTotal < 0 ? 0 : newTotal,
        },

        include: {
          items: true,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "ADD_BILL_ITEM",
        entityType: "Bill",
        entityId: billId,
        metadata: data,
      });

      return updatedBill;
    });
  },

  deleteBillItem: async (userSub: string, billId: string, itemId: string) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        tenant: true,
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const itemToDelete = await prisma.billItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!itemToDelete || itemToDelete.billId !== billId) {
      throw new Error("ITEM_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      await tx.billItem.delete({
        where: {
          id: itemId,
        },
      });

      if (
        itemToDelete.name === "หักเงินค่าเช่าล่วงหน้า" &&
        itemToDelete.type === "DISCOUNT"
      ) {
        await tx.tenantProfile.update({
          where: {
            id: bill.tenantId,
          },

          data: {
            advancePayment: {
              increment: itemToDelete.amount,
            },
          },
        });
      }

      const amountToReverse =
        itemToDelete.type === "CHARGE"
          ? -Number(itemToDelete.amount)
          : Number(itemToDelete.amount);
      const newTotal = bill.total + amountToReverse;

      const updatedBill = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          total: newTotal < 0 ? 0 : newTotal,
        },

        include: {
          items: true,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "DELETE_BILL_ITEM",
        entityType: "BillItem",
        entityId: itemId,

        metadata: {
          billId,
          itemName: itemToDelete.name,
        },
      });

      return updatedBill;
    });
  },

  updateBillItem: async (
    userSub: string,
    billId: string,
    itemId: string,
    data: any,
  ) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const oldItem = await prisma.billItem.findUnique({
      where: {
        id: itemId,
      },
    });

    if (!oldItem || oldItem.billId !== billId) {
      throw new Error("ITEM_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.billItem.update({
        where: {
          id: itemId,
        },

        data: {
          name: data.name ?? oldItem.name,
          amount: data.amount ? Number(data.amount) : oldItem.amount,
          type: data.type ?? oldItem.type,
        },
      });

      let recalculatedTotal =
        bill.roomPriceSnapshot +
        bill.waterFeeSnapshot +
        bill.electricFeeSnapshot +
        bill.commonFeeSnapshot;

      if (bill.status === "OVERDUE") {
        recalculatedTotal += bill.lateFeeSnapshot;
      }

      const allItems = await tx.billItem.findMany({
        where: {
          billId: billId,
        },
      });

      allItems.forEach((item) => {
        if (item.type === "CHARGE") {
          recalculatedTotal += item.amount;
        } else if (item.type === "DISCOUNT") {
          recalculatedTotal -= item.amount;
        }
      });

      const updatedBill = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          total: recalculatedTotal < 0 ? 0 : recalculatedTotal,
        },

        include: {
          items: true,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "UPDATE_BILL_ITEM",
        entityType: "BillItem",
        entityId: itemId,

        metadata: {
          billId,
          oldData: oldItem,
          newData: data,
        },
      });

      return updatedBill;
    });
  },

  createBills: async (dormId: string, data: any, user: UserDecodedDto) => {
    const { billingMonth, items } = data;

    const [dormInfo, dormSettings, paymentSetting] = await Promise.all([
      prisma.dormitory.findUnique({
        where: {
          id: dormId,
        },

        include: {
          owner: true,
        },
      }),
      prisma.dormitorySetting.findUnique({
        where: {
          dormitoryId: dormId,
        },
      }),
      prisma.paymentSetting.findUnique({
        where: {
          dormitoryId: dormId,
        },
      }),
    ]);

    if (!dormInfo) throw new Error("DORM_NOT_FOUND");

    if (!dormSettings) throw new Error("DORM_SETTINGS_NOT_FOUND");

    const hasBank = paymentSetting?.bankAccount && paymentSetting?.bankName;
    const hasPromptPay = paymentSetting?.promptPayValue;

    if (!paymentSetting || (!hasBank && !hasPromptPay)) {
      throw new Error("PAYMENT_METHOD_REQUIRED");
    }

    const inputDate = new Date(billingMonth);
    const saveDate = new Date(
      Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), 1),
    );
    const createdBills = [];

    for (const item of items) {
      const room = await prisma.room.findUnique({
        where: {
          id: item.roomId,
        },

        include: {
          tenants: {
            where: {
              isActive: true,
            },
          },
        },
      });

      if (!room || room.tenants.length === 0) continue;

      const existingBill = await prisma.bill.findFirst({
        where: {
          roomId: room.id,
          billingMonth: saveDate,
        },
      });

      if (existingBill) {
        if (existingBill.status === "CANCELLED") {
          await prisma.bill.delete({
            where: {
              id: existingBill.id,
            },
          });
        } else {
          throw new Error(`DUPLICATE_BILL_FOUND:${room.roomNumber}`);
        }
      }

      const moveImage = async (tempKey?: string, type?: string) => {
        if (!tempKey || !tempKey.startsWith("temp-drafts/")) return tempKey;

        const ext = tempKey.split(".").pop();
        const newKey = `bills/${dormId}/${saveDate.getFullYear()}-${saveDate.getMonth() + 1}/${room.roomNumber}_${type}_${Date.now()}.${ext}`;
        return await moveTempFileToPermanent(tempKey, newKey);
      };

      const [finalWaterKey, finalElectricKey] = await Promise.all([
        moveImage(item.waterImageKey, "WATER"),
        moveImage(item.electricImageKey, "ELECTRIC"),
      ]);

      const tenant = room.tenants[0];
      const isWaterFlatRate = dormSettings.waterBillingType === "FLAT_RATE";
      const waterUsed = isWaterFlatRate
        ? 0
        : Number(item.currentWater) - Number(item.prevWater);
      const electricUsed =
        Number(item.currentElectric) - Number(item.prevElectric);
      const waterFee = isWaterFlatRate
        ? dormSettings.waterRate
        : waterUsed * dormSettings.waterRate;
      const electricFee = electricUsed * dormSettings.electricRate;
      const dueDate = new Date(saveDate);
      dueDate.setDate(dormSettings.dueDay);
      dueDate.setMonth(dueDate.getMonth() + dormSettings.dueMonthOffset);
      const now = new Date();
      const isImmediatelyOverdue = dueDate < now;
      let lateFeeAmount = 0;

      if (isImmediatelyOverdue) {
        const startDate = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
        );
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const daysLate = Math.floor(
          (endDate.getTime() - startDate.getTime()) / 86400000,
        );
        lateFeeAmount = Math.max(daysLate, 0) * dormSettings.lateFee;
      }

      const total =
        room.basePrice +
        waterFee +
        electricFee +
        Number(item.commonFee) +
        lateFeeAmount;

      const newBill = await prisma.bill.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          billingMonth: saveDate,
          dueDate: dueDate,
          tenantNameSnapshot: `${tenant.firstName} ${tenant.lastName}`,
          roomNumberSnapshot: room.roomNumber,
          roomPriceSnapshot: room.basePrice,
          waterBillingTypeSnapshot: dormSettings.waterBillingType,
          prevWaterUnitSnapshot: isWaterFlatRate ? 0 : Number(item.prevWater),
          currentWaterUnitSnapshot: isWaterFlatRate
            ? 0
            : Number(item.currentWater),
          waterUsedSnapshot: waterUsed,
          waterRateSnapshot: dormSettings.waterRate,
          waterFeeSnapshot: waterFee,
          prevElectricUnitSnapshot: Number(item.prevElectric),
          currentElectricUnitSnapshot: Number(item.currentElectric),
          electricUsedSnapshot: electricUsed,
          electricRateSnapshot: dormSettings.electricRate,
          electricFeeSnapshot: electricFee,
          commonFeeSnapshot: Number(item.commonFee),
          lateFeeSnapshot: isImmediatelyOverdue
            ? lateFeeAmount
            : dormSettings.lateFee,
          total: total,
          status: isImmediatelyOverdue ? "OVERDUE" : "PENDING",
          waterImageKey: finalWaterKey,
          electricImageKey: finalElectricKey,
        },
      });

      createdBills.push(newBill);
    }

    await createActivityLog({
      userId: user.sub,
      action: "BATCH_CREATE_BILLS",
      entityType: "Dormitory",
      entityId: dormId,

      metadata: {
        billingMonth: saveDate,
        generatedCount: createdBills.length,
      },
    });

    return createdBills;
  },

  deleteBill: async (userSub: string, billId: string) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        payment: {
          include: {
            slips: true,
          },
        },

        items: true,
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (bill.status === "PAID") {
      throw new Error("CANNOT_DELETE_PAID_BILL");
    }

    return await prisma.$transaction(async (tx) => {
      const advanceItem = bill.items.find(
        (item) =>
          item.name === "หักเงินค่าเช่าล่วงหน้า" && item.type === "DISCOUNT",
      );

      if (advanceItem) {
        await tx.tenantProfile.update({
          where: {
            id: bill.tenantId,
          },

          data: {
            advancePayment: {
              increment: advanceItem.amount,
            },
          },
        });
      }

      const filesToDelete: string[] = [];

      if (bill.waterImageKey) filesToDelete.push(bill.waterImageKey);

      if (bill.electricImageKey) filesToDelete.push(bill.electricImageKey);

      if (bill.payment && bill.payment.slips.length > 0) {
        bill.payment.slips.forEach((slip) =>
          filesToDelete.push(slip.objectKey),
        );
      }

      for (const key of filesToDelete) {
        deleteFile(key).catch((err) =>
          logger.error(`Cleanup R2 failed for key: ${key}`, err),
        );
      }

      if (bill.payment) {
        await tx.file.deleteMany({
          where: {
            paymentId: bill.payment.id,
          },
        });

        await tx.payment.delete({
          where: {
            id: bill.payment.id,
          },
        });
      }

      await tx.billItem.deleteMany({
        where: {
          billId: bill.id,
        },
      });

      await tx.bill.delete({
        where: {
          id: bill.id,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "DELETE_BILL",
        entityType: "Bill",
        entityId: billId,

        metadata: {
          roomNumber: bill.roomNumberSnapshot,
          tenantName: bill.tenantNameSnapshot,
          total: bill.total,
          hadImages: !!(bill.waterImageKey || bill.electricImageKey),
          billingMonth: bill.billingMonth,
        },
      });

      return {
        success: true,
        message: "BILL_DELETED_SUCCESSFULLY",
      };
    });
  },

  uploadSlip: async ({
    billId,
    userSub,
    file,
    objectKey,
    mimeType,
    size,
  }: {
    billId: string;
    userSub: string;
    file: Buffer;
    objectKey: string;
    mimeType: string;
    size: number;
  }) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        payment: true,
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    let isOwner = false;
    let verifierName: string | undefined = undefined;

    if (bill.room.dormitory.ownerId) {
      const owner = await prisma.ownerProfile.findUnique({
        where: {
          userId: userSub,
        },
      });

      if (owner && owner.id === bill.room.dormitory.ownerId) {
        isOwner = true;
        verifierName = owner.fullName;
      }
    }

    if (!isOwner) throw new Error("FORBIDDEN_ACCESS");

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error("INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED");
    }

    await uploadFile(file, objectKey, mimeType);

    const transactionResult = await prisma.$transaction(async (tx) => {
      let paymentId = bill.payment?.id;
      let oldFileToDelete = null;
      const billStatus = isOwner
        ? BillStatus.PAID
        : BillStatus.WAITING_FOR_VERIFICATION;
      const paymentStatus = isOwner
        ? PaymentStatus.VERIFIED
        : PaymentStatus.WAITING_VERIFY;

      if (!paymentId) {
        const newPayment = await tx.payment.create({
          data: {
            billId: bill.id,
            status: paymentStatus,
          },
        });

        paymentId = newPayment.id;
      } else {
        const existingSlip = await tx.file.findFirst({
          where: {
            paymentId: paymentId,
            category: FileCategory.PAYMENT_SLIP,
          },
        });

        if (existingSlip) {
          oldFileToDelete = existingSlip;

          await tx.file.delete({
            where: {
              id: existingSlip.id,
            },
          });
        }
      }

      const newFile = await tx.file.create({
        data: {
          bucket: env.BUCKET,
          objectKey: objectKey,
          mimeType: mimeType,
          size: size,
          category: FileCategory.PAYMENT_SLIP,
          paymentId: paymentId,
        },
      });

      if (bill.status !== BillStatus.CANCELLED) {
        await tx.bill.update({
          where: {
            id: billId,
          },

          data: {
            status: billStatus,
          },
        });
      }

      await tx.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          status: paymentStatus,
          verifiedAt: isOwner ? new Date() : null,
          verifiedBy: isOwner ? verifierName : null,
          updatedAt: new Date(),
          paymentMethod: PaymentMethod.TRANSFER,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "UPLOAD_PAYMENT_SLIP",
        entityType: "Bill",
        entityId: billId,

        metadata: {
          fileKey: objectKey,
        },
      });

      return {
        newFile,
        oldFileToDelete,
      };
    });

    if (transactionResult.oldFileToDelete) {
      try {
        await deleteFile(transactionResult.oldFileToDelete.objectKey);
      } catch (error: any) {
        logger.error(
          `Failed to delete old slip from R2: ${transactionResult.oldFileToDelete.objectKey}`,
          error,
        );
      }
    }

    const signedUrl = await generateSignedUrl(
      transactionResult.newFile.objectKey,
    );

    return {
      ...transactionResult.newFile,
      url: signedUrl,
    };
  },

  updateStatus: async (userSub: string, billId: string, status: BillStatus) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        payment: {
          include: {
            slips: true,
          },
        },
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const verifierName = owner.fullName;

    return await prisma.$transaction(async (tx) => {
      if (status === BillStatus.PAID) {
        if (bill.payment) {
          const hasSlip = bill.payment.slips && bill.payment.slips.length > 0;
          const method = hasSlip ? PaymentMethod.TRANSFER : PaymentMethod.CASH;

          await tx.payment.update({
            where: {
              id: bill.payment.id,
            },

            data: {
              status: PaymentStatus.VERIFIED,
              verifiedBy: verifierName,
              verifiedAt: new Date(),
              paymentMethod: method,
              updatedAt: new Date(),
            },
          });
        } else {
          await tx.payment.create({
            data: {
              billId: billId,
              status: PaymentStatus.VERIFIED,
              verifiedBy: verifierName,
              verifiedAt: new Date(),
              paymentMethod: PaymentMethod.CASH,
            },
          });
        }
      } else {
        if (bill.payment) {
          let paymentUpdateData: any = {
            updatedAt: new Date(),
          };

          switch (status) {
            case BillStatus.CANCELLED:
              paymentUpdateData.status = PaymentStatus.REJECTED;
              break;
            case BillStatus.WAITING_FOR_VERIFICATION:
            case BillStatus.PENDING:
              paymentUpdateData.status = PaymentStatus.WAITING_VERIFY;
              paymentUpdateData.verifiedBy = null;
              paymentUpdateData.verifiedAt = null;
              break;
          }

          await tx.payment.update({
            where: {
              id: bill.payment.id,
            },

            data: paymentUpdateData,
          });
        }
      }

      const updatedBill = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          status: status,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "UPDATE_BILL_STATUS",
        entityType: "Bill",
        entityId: billId,

        metadata: {
          newStatus: status,
          oldStatus: bill.status,
        },
      });

      return updatedBill;
    });
  },

  applyAdvancePayment: async (userSub: string, billId: string) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        tenant: true,
        items: true,
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    if (bill.status !== "PENDING") throw new Error("BILL_NOT_PENDING");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!bill.tenant || bill.tenant.advancePayment <= 0) {
      throw new Error("NO_ADVANCE_PAYMENT");
    }

    const alreadyApplied = bill.items.some(
      (item) => item.name === "หักเงินค่าเช่าล่วงหน้า",
    );

    if (alreadyApplied) {
      throw new Error("ALREADY_APPLIED");
    }

    const advanceAmount = bill.tenant.advancePayment;
    const actualDeduction = Math.min(advanceAmount, bill.total);
    const remainingAdvance = advanceAmount - actualDeduction;

    return await prisma.$transaction(async (tx) => {
      await tx.tenantProfile.update({
        where: {
          id: bill.tenantId,
        },

        data: {
          advancePayment: remainingAdvance,
        },
      });

      await tx.billItem.create({
        data: {
          billId: billId,
          name: "หักเงินค่าเช่าล่วงหน้า",
          amount: actualDeduction,
          type: "DISCOUNT",
        },
      });

      const newTotal = bill.total - actualDeduction;

      const updatedBill = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          total: newTotal,
        },

        include: {
          items: true,
        },
      });

      await createActivityLog({
        userId: userSub,
        action: "APPLY_ADVANCE_PAYMENT",
        entityType: "Bill",
        entityId: billId,

        metadata: {
          appliedAmount: actualDeduction,
          remainingAdvance: remainingAdvance,
        },
      });

      return updatedBill;
    });
  },

  rejectBill: async (
    userSub: string,
    billId: string,
    reason: string = "สลิปไม่ถูกต้อง โปรดตรวจสอบแล้วแนบสลิปเข้ามาใหม่",
  ) => {
    const bill = await prisma.bill.findUnique({
      where: {
        id: billId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        tenant: true,

        payment: {
          include: {
            slips: true,
          },
        },
      },
    });

    if (!bill) throw new Error("BILL_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userSub,
      },
    });

    if (!owner || owner.id !== bill.room.dormitory.ownerId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!bill.payment) {
      throw new Error("NO_PAYMENT_FOUND");
    }

    const slipObjectKeys = bill.payment.slips.map((slip) => slip.objectKey);

    const updatedBill = await prisma.$transaction(async (tx) => {
      await tx.file.deleteMany({
        where: {
          paymentId: bill.payment!.id,
        },
      });

      await tx.payment.delete({
        where: {
          id: bill.payment!.id,
        },
      });

      const updated = await tx.bill.update({
        where: {
          id: billId,
        },

        data: {
          status: "PENDING",
        },
      });

      return updated;
    });

    for (const objectKey of slipObjectKeys) {
      try {
        await deleteFile(objectKey);
      } catch (r2Error: any) {
        logger.error(
          `[R2_DELETE_ERROR] ลบไฟล์สลิปไม่สำเร็จ Key: ${objectKey}`,
          r2Error,
        );
      }
    }

    if (bill.tenant?.email) {
      const emailData = {
        type: EmailType.REJECT_SLIP,
        to: bill.tenant.email,
        senderName: bill.room.dormitory.name,

        data: {
          dormName: bill.room.dormitory.name,
          billId: bill.id.substring(0, 8).toUpperCase(),
          roomNumber: bill.roomNumberSnapshot,
          tenantName: bill.tenantNameSnapshot,
          month: formatDateTH(bill.billingMonth),

          amount: bill.total.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          }),

          reason: reason,
          link: `${env.FRONTEND_URL}/tenant/bills/${bill.id}`,
        },
      };

      try {
        await emailQueue.add(EMAIL_JOB_NAME, emailData);
      } catch (queueErr) {
        logger.error(
          `[Service] เกิดข้อผิดพลาดตอนโยนเข้า Queue (ส่งอีเมล Reject บิล ${bill.id}): ${queueErr}`,
        );
      }
    }

    await createActivityLog({
      userId: userSub,
      action: "REJECT_BILL_SLIP",
      entityType: "Bill",
      entityId: billId,

      metadata: {
        reason,
      },
    });

    return updatedBill;
  },

  getDrafts: async ({ dormId, sub }: { dormId: string; sub: string }) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const dorm = await prisma.dormitory.findFirst({
      where: {
        id: dormId,
        ownerId: owner.id,
      },
    });

    if (!dorm) throw new Error("FORBIDDEN: ไม่สิทธิ์เข้าถึงข้อมูลของตึกนี้");

    const drafts = await prisma.billDraft.findMany({
      where: {
        dormitoryId: dormId,
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

    return drafts;
  },

  saveDraft: async ({
    dormId,
    name,
    selectedDate,
    items,
    sub,
    ipAddress,
  }: {
    dormId: string;
    name: string;
    selectedDate: string;
    items: any[];
    sub: string;
    ipAddress?: string;
  }) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const dorm = await prisma.dormitory.findFirst({
      where: {
        id: dormId,
        ownerId: owner.id,
      },
    });

    if (!dorm) throw new Error("FORBIDDEN: ไม่มีสิทธิ์เข้าถึงข้อมูลของตึกนี้");

    const draft = await prisma.billDraft.create({
      data: {
        dormitoryId: dormId,
        name,
        selectedDate: new Date(selectedDate),
        items: items,
      },
    });

    await createActivityLog({
      userId: sub,
      action: "CREATE_BILL_DRAFT",
      entityType: "BILL_DRAFT",
      entityId: draft.id,
      ipAddress,

      metadata: {
        dormId,
        name,
      },
    });

    return draft;
  },

  deleteDraft: async ({
    draftId,
    sub,
    ipAddress,
  }: {
    draftId: string;
    sub: string;
    ipAddress?: string;
  }) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const draft = await prisma.billDraft.findUnique({
      where: {
        id: draftId,
      },

      include: {
        dormitory: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!draft) throw new Error("DRAFT_NOT_FOUND");

    if (draft.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN: ไม่มีสิทธิ์ลบข้อมูลนี้");
    }

    try {
      const items = draft.items as any[];

      if (items && Array.isArray(items)) {
        const keysToDelete: string[] = [];

        items.forEach((item: any) => {
          if (item.waterImageKey) keysToDelete.push(item.waterImageKey);

          if (item.electricImageKey) keysToDelete.push(item.electricImageKey);
        });

        if (keysToDelete.length > 0) {
          await Promise.all(
            keysToDelete.map((key) =>
              deleteFile(key).catch((err) =>
                logger.error(
                  `Failed to delete draft image from R2: ${key}`,
                  err,
                ),
              ),
            ),
          );
        }
      }
    } catch (error) {
      logger.error(`Error while deleting draft images: ${error}`);
    }

    await prisma.billDraft.delete({
      where: {
        id: draftId,
      },
    });

    await createActivityLog({
      userId: sub,
      action: "DELETE_BILL_DRAFT",
      entityType: "BILL_DRAFT",
      entityId: draftId,
      ipAddress,

      metadata: {
        name: draft.name,
      },
    });

    return true;
  },

  uploadTempImage: async ({
    sub,
    buffer,
    mimetype,
    filename,
  }: {
    sub: string;
    buffer: Buffer;
    mimetype: string;
    filename: string;
  }) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const compressedBuffer = await sharp(buffer)
      .resize({
        width: 1200,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 70,
      })
      .toBuffer();

    const finalMimeType = "image/jpeg";
    const finalFilename = filename.split(".")[0] + ".jpg";
    const timestamp = Date.now();
    const objectKey = `temp-drafts/${owner.id}_${timestamp}_${finalFilename}`;
    await uploadFile(compressedBuffer, objectKey, finalMimeType);
    const url = await generateSignedUrl(objectKey, 86400);

    return {
      url,
      objectKey,
    };
  },

  deleteTempImage: async (objectKey: string) => {
    if (!objectKey.startsWith("temp-drafts/")) {
      throw new Error("Deleting temporary files (temp-drafts) is not allowed.");
    }

    await deleteFile(objectKey);
    return true;
  },

  sendBillEmails: async ({
    sub,
    billIds,
  }: {
    sub: string;
    billIds: string[];
  }) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) {
      logger.error(`[Service]  ไม่พบข้อมูล Owner (userId: ${sub})`);
      throw new Error("OWNER_NOT_FOUND");
    }

    const bills = await prisma.bill.findMany({
      where: {
        id: {
          in: billIds,
        },

        room: {
          dormitory: {
            ownerId: owner.id,
          },
        },
      },

      include: {
        room: {
          include: {
            dormitory: {
              include: {
                contacts: {
                  orderBy: {
                    order: "asc",
                  },

                  take: 1,
                },
              },
            },
          },
        },

        tenant: true,
        items: true,
      },
    });

    if (bills.length === 0)
      return {
        success: true,
        count: 0,
      };

    let queuedCount = 0;

    for (const bill of bills) {
      if (!bill.tenant?.email) continue;

      let daysLate = 0;

      if (bill.status === "OVERDUE") {
        const today = new Date();
        const due = new Date(bill.dueDate);
        const diff = Math.floor(
          (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
        );
        daysLate = diff > 0 ? diff : 0;
      }

      const emailData = {
        type: EmailType.NEW_BILL,
        to: bill.tenant.email,
        senderName: bill.room.dormitory.name,

        data: {
          dormName: bill.room.dormitory.name,
          ownerPhone: bill.room.dormitory.contacts?.[0]?.phone || "-",
          billId: bill.id.substring(0, 8).toUpperCase(),
          currentDate: formatDateTH(new Date()),
          tenantName: bill.tenantNameSnapshot,
          roomNumber: bill.roomNumberSnapshot,
          month: formatDateTH(bill.billingMonth),
          dueDate: formatDateTH(bill.dueDate),

          amount: bill.total.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
          }),

          link: `${env.FRONTEND_URL}/tenant/bills/${bill.id}`,
          status: bill.status,
          daysLate: daysLate,

          details: {
            rent: bill.roomPriceSnapshot.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            }),

            water: {
              prev: bill.prevWaterUnitSnapshot,
              curr: bill.currentWaterUnitSnapshot,
              used: bill.waterUsedSnapshot,
              unitPrice: bill.waterRateSnapshot,

              total: bill.waterFeeSnapshot.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              }),
            },

            electric: {
              prev: bill.prevElectricUnitSnapshot,
              curr: bill.currentElectricUnitSnapshot,
              used: bill.electricUsedSnapshot,
              unitPrice: bill.electricRateSnapshot,

              total: bill.electricFeeSnapshot.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              }),
            },

            commonFee: bill.commonFeeSnapshot.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            }),

            commonFeeRaw: bill.commonFeeSnapshot,
            lateFee: bill.lateFeeSnapshot,
            items: bill.items || [],
          },
        },
      };

      try {
        await emailQueue.add(EMAIL_JOB_NAME, emailData);
        queuedCount++;

        await prisma.bill.update({
          where: {
            id: bill.id,
          },

          data: {
            lastNotifiedAt: new Date(),
          },
        });
      } catch (queueErr) {
        logger.error(
          `[Service]เกิดข้อผิดพลาดตอนโยนเข้า Queue (บิล ${bill.id}): ${queueErr}`,
        );
      }
    }

    await createActivityLog({
      userId: sub,
      action: "SEND_BILL_EMAILS",
      entityType: "Bill",

      metadata: {
        requestedCount: billIds.length,
        queuedCount,
      },
    });

    return {
      success: true,
      count: queuedCount,
      message: `เตรียมส่งอีเมลสำเร็จ ${queuedCount} รายการ`,
    };
  },

  scanMeter: async (
    imageBase64: string,
    scanType: string = "ELECTRIC",
    roomId: string,
    user: UserDecodedDto,
  ) => {
    const ocrServiceUrl = env.OCR_SERVICE_URL;

    if (!ocrServiceUrl) {
      logger.error("[Service] OCR_SERVICE_URL is not set.");
      throw new Error("OCR_SERVICE_URL_NOT_CONFIGURED");
    }

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    await assertCanUseOcr(owner.id);

    const room = await prisma.room.findFirst({
      where: {
        id: roomId,

        dormitory: {
          ownerId: owner.id,
        },
      },

      include: {
        meterSetting: true,
      },
    });

    if (!room) {
      throw new Error("ROOM_NOT_FOUND_OR_UNAUTHORIZED");
    }

    let EXPECTED_DIGIT_LENGTH = scanType === "WATER" ? 4 : 5;

    if (room.meterSetting) {
      EXPECTED_DIGIT_LENGTH =
        scanType === "WATER"
          ? room.meterSetting.waterMeterDigits || 4
          : room.meterSetting.electricMeterDigits || 5;
    }

    // ค่าเดือนก่อน + เกณฑ์การใช้งานปกติของห้องนี้ ส่งให้ OCR ใช้ช่วยเลือกคำตอบ และใช้เตือนผู้ใช้
    const recentBills = await prisma.bill.findMany({
      where: {
        roomId,
      },

      orderBy: {
        billingMonth: "desc",
      },

      take: OCR_USAGE_HISTORY_MONTHS,
    });

    const prevValue =
      recentBills.length > 0
        ? scanType === "WATER"
          ? recentBills[0].currentWaterUnitSnapshot
          : recentBills[0].currentElectricUnitSnapshot
        : null;

    const usageHistory = recentBills
      .map((b) =>
        scanType === "WATER"
          ? b.currentWaterUnitSnapshot - b.prevWaterUnitSnapshot
          : b.currentElectricUnitSnapshot - b.prevElectricUnitSnapshot,
      )
      .filter((u) => u >= 0);

    const defaultMaxUsage = scanType === "WATER" ? 100 : 2000;
    const minMaxUsage = scanType === "WATER" ? 20 : 200;
    const maxNormalUsage =
      usageHistory.length >= 2
        ? Math.max(
            Math.ceil(
              (usageHistory.reduce((a, b) => a + b, 0) / usageHistory.length) *
                OCR_USAGE_SPIKE_FACTOR,
            ),
            minMaxUsage,
          )
        : defaultMaxUsage;

    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const blob = new Blob([buffer], {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("image", blob, "meter.jpg");
      formData.append("expected_digits", String(EXPECTED_DIGIT_LENGTH));
      formData.append("max_usage", String(maxNormalUsage));

      if (prevValue !== null) {
        formData.append("prev_value", String(Math.floor(prevValue)));
      }

      const response = await fetch(ocrServiceUrl, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(OCR_REQUEST_TIMEOUT_MS),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.warn(
          `[Service] OCR Service Rejected Image: ${JSON.stringify(data)}`,
        );

        return {
          success: false,
          message: data.message || "UNREADABLE_IMAGE",
          errorCode: data.error_code || "OCR_ERROR",
        };
      }

      // OCR service ตัดหลักเกิน (ทศนิยม/เลขสีแดง) ให้แล้ว ตัดซ้ำไว้กันพลาดเผื่อ service เวอร์ชันเก่า
      let finalNumber: string = data.meter_number ?? "";

      if (finalNumber.length > EXPECTED_DIGIT_LENGTH) {
        finalNumber = finalNumber.substring(0, EXPECTED_DIGIT_LENGTH);
      }

      const currentValue = Number(finalNumber);
      let suspicious = false;
      const warnings: string[] = [];

      if (finalNumber.length < EXPECTED_DIGIT_LENGTH) {
        suspicious = true;
        warnings.push(
          `อ่านได้ ${finalNumber.length} หลัก แต่มิเตอร์นี้มี ${EXPECTED_DIGIT_LENGTH} หลัก`,
        );
      } else if (!Number.isNaN(currentValue) && prevValue !== null) {
        if (currentValue < prevValue) {
          suspicious = true;
          warnings.push(
            `ค่าที่อ่านได้ (${currentValue}) น้อยกว่าเดือนก่อน (${prevValue})`,
          );
        } else if (currentValue - prevValue > maxNormalUsage) {
          suspicious = true;
          warnings.push(
            `การใช้งานเดือนนี้ (${currentValue - prevValue} หน่วย) สูงผิดปกติ`,
          );
        }
      }

      // เหตุผลจาก OCR service (จำนวนหลัก/ค่าเทียบเดือนก่อน ตรวจเองข้างบนแล้ว จึงไม่ซ้ำ)
      warnings.push(...ocrReviewMessages(data, finalNumber));

      const warningMessage =
        warnings.length > 0
          ? `${warnings.join(" • ")} — กรุณาตรวจสอบกับรูปก่อนยืนยัน`
          : undefined;

      return {
        success: true,
        number: finalNumber,
        rawText: data.ocr_digits ?? data.raw_digits ?? data.meter_number,
        correctedText: finalNumber,
        needsReview: Boolean(data.needs_review) || suspicious,
        suspicious,
        warningMessage,
        prevValue,
      };
    } catch (error: any) {
      logger.error(`[Service] scanMeter HTTP Error: ${error.message}`);
      throw new Error("FAILED_TO_PROCESS_OCR");
    }
  },

  generateBulkBillPdf: async (userId: string, billIds: string[]) => {
    const bills = await prisma.bill.findMany({
      where: {
        id: {
          in: billIds,
        },

        room: {
          dormitory: {
            owner: {
              userId: userId,
            },
          },
        },
      },

      include: {
        items: true,

        room: {
          include: {
            dormitory: {
              include: {
                owner: true,

                contacts: {
                  orderBy: {
                    order: "asc",
                  },

                  take: 1,
                },
              },
            },
          },
        },
      },

      orderBy: {
        roomNumberSnapshot: "asc",
      },
    });

    if (bills.length === 0) {
      throw new Error("ไม่พบข้อมูลบิล หรือคุณไม่มีสิทธิ์เข้าถึง");
    }

    const today = new Date();

    const formatThaiDate = (date: any, options: any) =>
      new Intl.DateTimeFormat("th-TH", {
        ...options,
        year: "numeric",
      }).format(new Date(date));

    const formatMoney = (amount: number) =>
      amount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
      });

    const stamps = await getCachedStamps();

    const billsData = bills.map((bill) => {
      let finalDaysLate = 0;
      const dueDate = new Date(bill.dueDate);

      if (bill.status === "OVERDUE") {
        const startDatePdf = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate(),
        );
        const endDatePdf = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        const daysLate = Math.floor(
          (endDatePdf.getTime() - startDatePdf.getTime()) / 86400000,
        );
        finalDaysLate = daysLate > 0 ? daysLate : 0;
      }

      return {
        bill,
        finalDaysLate,
      };
    });

    const publicPath = env.PUBLIC_PATH || process.cwd() + "/public";
    const htmlContent = buildBulkBillHtmlTemplate(
      billsData,
      formatMoney,
      formatThaiDate,
      stamps,
      publicPath,
    );
    const pdfBuffer = await createPdfFromHtml(htmlContent);
    const firstRoom = bills[0].roomNumberSnapshot;
    const lastRoom = bills[bills.length - 1].roomNumberSnapshot;

    const monthStr = new Date(bills[0].billingMonth)
      .toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      .replace(" ", "");

    let filename = "";

    if (bills.length === 1) {
      filename = `Invoice_${firstRoom}_${monthStr}.pdf`;
    } else {
      filename = `Invoices_${firstRoom}_to_${lastRoom}_${monthStr}.pdf`;
    }

    return {
      pdfBuffer,
      filename,
    };
  },
};
