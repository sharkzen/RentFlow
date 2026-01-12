import prisma from "@/lib/prisma";
import { CreateBillDto, GetBillsQueryDto } from "./dto/bill.dto";
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

          tenant: {
            select: {
              firstName: true,
              lastName: true,
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

  createBills: async (dormId: string, data: any) => {
    const { billingMonth, items } = data;

    const billingDate = new Date(billingMonth);

    const dormSettings = await prisma.dormitorySetting.findUnique({
      where: {
        dormitoryId: dormId,
      },
    });

    if (!dormSettings) throw new Error("DORM_SETTINGS_NOT_FOUND");

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

      const tenant = room.tenants[0];
      const waterUsed = item.currentWater - item.prevWater;
      const electricUsed = item.currentElectric - item.prevElectric;
      const waterFee = waterUsed * dormSettings.waterRate;
      const electricFee = electricUsed * dormSettings.electricRate;
      const total =
        (tenant.roomPriceSnapshot || room.basePrice) +
        waterFee +
        electricFee +
        Number(item.commonFee);
      const dueDate = new Date(billingDate);
      dueDate.setDate(dormSettings.dueDay);
      dueDate.setMonth(dueDate.getMonth() + dormSettings.dueMonthOffset);

      const newBill = await prisma.bill.create({
        data: {
          roomId: room.id,
          tenantId: tenant.id,
          billingMonth: billingDate,
          dueDate: dueDate,
          tenantNameSnapshot: `${tenant.firstName} ${tenant.lastName}`,
          roomNumberSnapshot: room.roomNumber,
          roomPriceSnapshot: tenant.roomPriceSnapshot || room.basePrice,
          prevWaterUnitSnapshot: Number(item.prevWater),
          currentWaterUnitSnapshot: Number(item.currentWater),
          waterUsedSnapshot: waterUsed,
          waterRateSnapshot: dormSettings.waterRate,
          waterFeeSnapshot: waterFee,
          prevElectricUnitSnapshot: Number(item.prevElectric),
          currentElectricUnitSnapshot: Number(item.currentElectric),
          electricUsedSnapshot: electricUsed,
          electricRateSnapshot: dormSettings.electricRate,
          electricFeeSnapshot: electricFee,
          commonFeeSnapshot: Number(item.commonFee),
          lateFeeSnapshot: dormSettings.lateFee,
          total: total,
          status: "PENDING",
        },
      });

      createdBills.push(newBill);
    }

    return createdBills;
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
};
