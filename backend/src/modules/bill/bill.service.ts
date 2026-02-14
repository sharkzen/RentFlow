import prisma from "@/lib/prisma";
import { CreateBillDto, GetBillsQueryDto } from "./dto/bill.dto";
import { emailQueue } from "@/queues/email.queue";
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
import { generateSignedUrl, minioClient } from "@/services/minio";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";

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
      room: {
        dormitoryId: dormId,

        dormitory: {
          ownerId: owner.id,
        },
      },

      archived: false,
    };

    if (status) where.status = status;

    if (search)
      where.room = {
        roomNumber: {
          contains: search,
        },
      };

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
          room: true,
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

        if (bill.status === "PENDING" && today > new Date(bill.dueDate)) {
          bill.status = "OVERDUE" as any;
          bill.total = bill.total + bill.lateFeeSnapshot;
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

      return updatedBill;
    });
  },

  createBills: async (dormId: string, data: any, user: UserDecodedDto) => {
    const { billingMonth, items } = data;

    const [dormInfo, dormSettings, paymentSetting, users] = await Promise.all([
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
      prisma.user.findUnique({
        where: {
          id: user.sub,
        },
      }),
    ]);

    if (!dormInfo || !dormInfo.owner)
      throw new Error("DORM_OR_OWNER_NOT_FOUND");

    if (!dormSettings) throw new Error("DORM_SETTINGS_NOT_FOUND");

    const hasBank = paymentSetting?.bankAccount && paymentSetting?.bankName;
    const hasPromptPay = paymentSetting?.promptPayValue;

    if (!paymentSetting || (!hasBank && !hasPromptPay)) {
      throw new Error("PAYMENT_METHOD_REQUIRED");
    }

    const senderName = dormInfo.name;
    const ownerEmail = users?.email;
    const inputDate = new Date(billingMonth);
    const saveDate = new Date(
      Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), 1, 0, 0, 0),
    );
    const createdBills = [];
    const emailJobs = [];

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
          throw new Error(
            `DUPLICATE_BILL_FOUND: ห้อง ${room.roomNumber} มีบิลสถานะ ${existingBill.status} อยู่แล้ว`,
          );
        }
      }

      const tenant = room.tenants[0];
      const waterUsed = item.currentWater - item.prevWater;
      const electricUsed = item.currentElectric - item.prevElectric;
      const waterRate = dormSettings.waterRate;
      const electricRate = dormSettings.electricRate;
      const waterFee = waterUsed * waterRate;
      const electricFee = electricUsed * electricRate;
      const roomPrice = room.basePrice;
      const total = roomPrice + waterFee + electricFee + Number(item.commonFee);
      const dueDate = new Date(saveDate);
      dueDate.setDate(dormSettings.dueDay);
      dueDate.setMonth(dueDate.getMonth() + dormSettings.dueMonthOffset);

      const newBill = await prisma.bill.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          billingMonth: saveDate,
          dueDate: dueDate,
          tenantNameSnapshot: `${tenant.firstName} ${tenant.lastName}`,
          roomNumberSnapshot: room.roomNumber,
          roomPriceSnapshot: roomPrice,
          prevWaterUnitSnapshot: Number(item.prevWater),
          currentWaterUnitSnapshot: Number(item.currentWater),
          waterUsedSnapshot: waterUsed,
          waterRateSnapshot: waterRate,
          waterFeeSnapshot: waterFee,
          prevElectricUnitSnapshot: Number(item.prevElectric),
          currentElectricUnitSnapshot: Number(item.currentElectric),
          electricUsedSnapshot: electricUsed,
          electricRateSnapshot: electricRate,
          electricFeeSnapshot: electricFee,
          commonFeeSnapshot: Number(item.commonFee),
          lateFeeSnapshot: dormSettings.lateFee,
          total: total,
          status: "PENDING",
        },
      });

      createdBills.push(newBill);

      if (tenant.email) {
        const formatThaiDate = (
          date: Date,
          options?: {
            day?: boolean;
          },
        ) => {
          return date.toLocaleDateString("th-TH", {
            ...(options?.day !== false && {
              day: "numeric",
            }),

            month: "long",
            year: "numeric",
          });
        };

        emailJobs.push({
          type: EmailType.NEW_BILL,
          to: tenant.email,
          senderName: senderName,
          replyTo: ownerEmail,

          data: {
            dormName: dormInfo.name,
            ownerPhone: dormInfo.owner?.phone,
            billId: newBill.id.substring(0, 8).toUpperCase(),
            currentDate: formatThaiDate(new Date()),
            roomNumber: room.roomNumber,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,

            month: formatThaiDate(saveDate, {
              day: false,
            }),

            dueDate: formatThaiDate(dueDate),
            link: `${process.env.FRONTEND_URL}/tenant/bills/${newBill.id}`,

            amount: total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }),

            details: {
              rent: roomPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),

              commonFeeRaw: Number(item.commonFee),

              commonFee: Number(item.commonFee).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),

              water: {
                prev: Number(item.prevWater),
                curr: Number(item.currentWater),
                used: waterUsed,
                unitPrice: waterRate,

                total: waterFee.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                }),
              },

              electric: {
                prev: Number(item.prevElectric),
                curr: Number(item.currentElectric),
                used: electricUsed,
                unitPrice: electricRate,

                total: electricFee.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                }),
              },
            },
          },
        });
      }
    }

    if (emailJobs.length > 0) {
      try {
        await Promise.all(emailJobs.map((job) => emailQueue.add(job)));
        logger.info(`📨 Queued ${emailJobs.length} emails.`);
      } catch (error: any) {
        logger.error(`⚠️ Email Queue Error: ${error.message}`);
      }
    }

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

      return {
        success: true,
        message: "BILL_DELETED",
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

    const command = new PutObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
      Body: file,
      ContentType: mimeType,
    });

    await minioClient.send(command);

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

      return {
        newFile,
        oldFileToDelete,
      };
    });

    if (transactionResult.oldFileToDelete) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: transactionResult.oldFileToDelete.bucket,
          Key: transactionResult.oldFileToDelete.objectKey,
        });

        await minioClient.send(deleteCommand);
      } catch (error: any) {
        logger.error(
          `Failed to delete old slip from MinIO: ${transactionResult.oldFileToDelete.objectKey}`,
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

    return await prisma.$transaction(async (tx) => {
      await tx.tenantProfile.update({
        where: {
          id: bill.tenantId,
        },

        data: {
          advancePayment: 0,
        },
      });

      await tx.billItem.create({
        data: {
          billId: billId,
          name: "หักเงินค่าเช่าล่วงหน้า",
          amount: advanceAmount,
          type: "DISCOUNT",
        },
      });

      const newTotal = bill.total - advanceAmount;

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

      return updatedBill;
    });
  },
};
