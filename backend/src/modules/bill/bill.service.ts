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

  async createBills(dormId: string, data: any) {
    const { billingMonth, items } = data;

    const billingDate = new Date(billingMonth);

    const dormSettings = await prisma.dormitorySetting.findUnique({
      where: {
        dormitoryId: dormId,
      },
    });

    if (!dormSettings) throw new Error("ไม่พบการตั้งค่าหอพัก");

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
