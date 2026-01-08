import prisma from "@/lib/prisma";
import { CreateBillDto, GetBillsQueryDto } from "./dto/bill.dto";
import { BillStatus, Bill } from "@prisma/client";

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

          payment: true,
        },

        orderBy: {
          room: {
            roomNumber: "asc",
          },
        },

        skip,
        take: limit,
      }),
      prisma.bill.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  createBills: async (sub: string, data: CreateBillDto) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    const settings = await prisma.dormitorySetting.findUnique({
      where: {
        dormitoryId: data.dormId,
      },
    });

    if (!settings) throw new Error("DORM_SETTINGS_NOT_FOUND");

    const billingDate = new Date(data.billingMonth);
    const dueDate = new Date(billingDate);
    dueDate.setDate(dueDate.getDate() + settings.dueDay);
    const results: Bill[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const room = await tx.room.findUnique({
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

        const lastBill = await tx.bill.findFirst({
          where: {
            roomId: item.roomId,

            status: {
              not: "CANCELLED",
            },
          },

          orderBy: {
            billingMonth: "desc",
          },
        });

        const prevWater = lastBill ? lastBill.waterUnitSnapshot : 0;
        const prevElectric = lastBill ? lastBill.electricUnitSnapshot : 0;
        const waterUsage = Math.max(0, item.waterUnit - prevWater);
        const electricUsage = Math.max(0, item.electricUnit - prevElectric);
        const waterCost = waterUsage * settings.waterRate;
        const electricCost = electricUsage * settings.electricRate;
        const total =
          room.basePrice +
          waterCost +
          electricCost +
          (item.commonFee || settings.commonFee) +
          (item.otherFee || 0);

        const bill = await tx.bill.create({
          data: {
            roomId: item.roomId,
            tenantId: tenant.id,
            billingMonth: billingDate,
            dueDate: dueDate,
            tenantNameSnapshot: `${tenant.firstName} ${tenant.lastName}`,
            roomNumberSnapshot: room.roomNumber,
            roomPriceSnapshot: room.basePrice,
            waterUnitSnapshot: item.waterUnit,
            electricUnitSnapshot: item.electricUnit,
            waterRateSnapshot: settings.waterRate,
            electricRateSnapshot: settings.electricRate,
            commonFeeSnapshot: item.commonFee || settings.commonFee,
            lateFeeSnapshot: settings.lateFee,
            total: total,
            status: "PENDING",
          },
        });

        results.push(bill);
      }
    });

    return results;
  },

  updateStatus: async (sub: string, billId: string, status: BillStatus) => {
    return await prisma.bill.update({
      where: {
        id: billId,
      },

      data: {
        status,
      },
    });
  },
};
