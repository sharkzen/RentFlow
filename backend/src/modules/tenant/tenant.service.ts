import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/auth/lib/password";
import {
  RoomStatus,
  UserRole,
  Status,
  BillStatus,
  MaintenanceStatus,
} from "@prisma/client";

interface GetTenantDormParams {
  dormId: string;
  sub: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const tenantService = {
  getTenantDorm: async ({
    dormId,
    sub,
    page = 1,
    limit = 10,
    search,
    status = "active",
  }: GetTenantDormParams) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },

      select: {
        id: true,
      },
    });

    if (!owner) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const where: any = {
      room: {
        dormitory: {
          id: dormId,
          ownerId: owner.id,
        },
      },

      deletedAt: null,
    };

    if (status === "active") {
      where.isActive = true;
    } else if (status === "moved_out") {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          idCard: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          room: {
            roomNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,

        orderBy: search
          ? undefined
          : {
              room: {
                roomNumber: "asc",
              },
            },

        include: {
          room: true,

          user: {
            select: {
              id: true,
              email: true,
              status: true,
            },
          },
        },
      }),
      prisma.tenantProfile.count({
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

  createTenant: async (userId: string, data: any) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const room = await prisma.room.findUnique({
      where: {
        id: data.roomId,
      },

      include: {
        dormitory: true,
      },
    });

    if (!room) throw new Error("ROOM_NOT_FOUND");

    if (room.dormitory.ownerId !== owner.id) throw new Error("DORM_NOT_OWNED");

    if (room.status !== RoomStatus.AVAILABLE)
      throw new Error("ROOM_NOT_AVAILABLE");

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    const rawPassword = data.password || data.phone || "12345678";
    const hashedPassword = await hashPassword(rawPassword);

    return await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: UserRole.TENANT,
          status: Status.ACTIVE,
        },
      });

      const newTenant = await tx.tenantProfile.create({
        data: {
          userId: newUser.id,
          roomId: data.roomId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          idCard: data.idCard,
          email: data.email,
          address: data.address,
          numberOfResidents: Number(data.numberOfResidents) || 1,
          roomPriceSnapshot: room.basePrice,
          tenantNameSnapshot: `${data.firstName} ${data.lastName}`,
          moveInDate: data.moveInDate ? new Date(data.moveInDate) : new Date(),
          contractStartDate: data.contractStartDate
            ? new Date(data.contractStartDate)
            : new Date(),
          contractEndDate: data.contractEndDate
            ? new Date(data.contractEndDate)
            : null,
          securityDeposit: Number(data.securityDeposit) || 0,
          advancePayment: Number(data.advancePayment) || 0,
          entranceFee: Number(data.entranceFee) || 0,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          notes: data.notes,
        },
      });

      await tx.room.update({
        where: {
          id: data.roomId,
        },

        data: {
          status: RoomStatus.OCCUPIED,
        },
      });

      return newTenant;
    });
  },

  getTenantById: async (sub: string, tenantId: string) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        user: {
          select: {
            email: true,
            status: true,
          },
        },

        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    return tenant;
  },

  updateTenant: async (sub: string, tenantId: string, data: any) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        user: true,

        room: {
          include: {
            dormitory: true,
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!tenant.isActive) {
      throw new Error("TENANT_ALREADY_MOVED_OUT");
    }

    const userUpdatePayload: any = {};

    if (data.email && data.email !== tenant.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (duplicateUser) throw new Error("EMAIL_ALREADY_EXISTS");

      userUpdatePayload.email = data.email;
    }

    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await hashPassword(data.password);
      userUpdatePayload.password = hashedPassword;
    }

    if (data.isActive !== undefined) {
      userUpdatePayload.status = data.isActive ? "ACTIVE" : "BANNED";
    }

    const tenantUpdatePayload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      idCard: data.idCard,
      address: data.address,
      email: data.email || undefined,
      securityDeposit:
        data.securityDeposit !== undefined
          ? Number(data.securityDeposit)
          : undefined,
      advancePayment:
        data.advancePayment !== undefined
          ? Number(data.advancePayment)
          : undefined,
      entranceFee:
        data.entranceFee !== undefined ? Number(data.entranceFee) : undefined,
      numberOfResidents:
        data.numberOfResidents !== undefined
          ? Number(data.numberOfResidents)
          : undefined,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      notes: data.notes,
    };

    if (data.moveInDate)
      tenantUpdatePayload.moveInDate = new Date(data.moveInDate);

    if (data.contractStartDate)
      tenantUpdatePayload.contractStartDate = new Date(data.contractStartDate);

    if (data.contractEndDate)
      tenantUpdatePayload.contractEndDate = new Date(data.contractEndDate);

    Object.keys(tenantUpdatePayload).forEach(
      (key) =>
        tenantUpdatePayload[key] === undefined &&
        delete tenantUpdatePayload[key],
    );

    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdatePayload).length > 0) {
        await tx.user.update({
          where: {
            id: tenant.userId,
          },

          data: userUpdatePayload,
        });
      }

      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: tenantUpdatePayload,
      });

      return updatedTenant;
    });
  },

  moveOut: async (sub: string, tenantId: string) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const tenant = await prisma.tenantProfile.findUnique({
      where: {
        id: tenantId,
      },

      include: {
        room: {
          include: {
            dormitory: true,
          },
        },

        bills: {
          where: {
            status: {
              in: ["PENDING", "OVERDUE"],
            },
          },
        },
      },
    });

    if (!tenant) throw new Error("TENANT_NOT_FOUND");

    if (tenant.room && tenant.room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (!tenant.isActive && tenant.moveOutDate) {
      throw new Error("ALREADY_MOVED_OUT");
    }

    if (tenant.bills.length > 0) {
      throw new Error("OUTSTANDING_BILLS_EXIST");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedTenant = await tx.tenantProfile.update({
        where: {
          id: tenantId,
        },

        data: {
          moveOutDate: new Date(),
          isActive: false,
        },
      });

      if (tenant.roomId) {
        await tx.room.update({
          where: {
            id: tenant.roomId,
          },

          data: {
            status: RoomStatus.AVAILABLE,
          },
        });
      }

      await tx.user.update({
        where: {
          id: tenant.userId,
        },

        data: {
          status: "INACTIVE",
        },
      });

      return updatedTenant;
    });
  },

  getDashboardStats: async (userId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId: userId,
        isActive: true,
        deletedAt: null,
      },

      include: {
        room: {
          include: {
            dormitory: {
              select: {
                name: true,

                owner: {
                  select: {
                    fullName: true,
                    phone: true,
                    lineId: true,
                    facebook: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tenant || !tenant.room) {
      throw new Error("TENANT_NOT_FOUND_OR_NO_ROOM");
    }

    const latestBill = await prisma.bill.findFirst({
      where: {
        tenantId: tenant.id,
        roomId: tenant.room.id,

        status: {
          not: BillStatus.CANCELLED,
        },
      },

      orderBy: [
        {
          status: "asc",
        },
        {
          billingMonth: "desc",
        },
      ],
    });

    const maintenanceStats = await prisma.maintenanceRequest.groupBy({
      by: ["status"],

      where: {
        tenantId: tenant.id,

        status: {
          in: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS],
        },
      },

      _count: true,
    });

    const openMaint =
      maintenanceStats.find((m) => m.status === MaintenanceStatus.OPEN)
        ?._count || 0;
    const progressMaint =
      maintenanceStats.find((m) => m.status === MaintenanceStatus.IN_PROGRESS)
        ?._count || 0;

    return {
      tenant: {
        id: tenant.id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        roomNumber: tenant.room.roomNumber,
        dormName: tenant.room.dormitory.name,
      },

      contactInfo: {
        name: tenant.room.dormitory.owner.fullName,
        phone: tenant.room.dormitory.owner.phone,
        lineId: tenant.room.dormitory.owner.lineId,
        facebook: tenant.room.dormitory.owner.facebook,
      },

      bill: latestBill
        ? {
            id: latestBill.id,
            status: latestBill.status,
            amount: latestBill.total,
            dueDate: latestBill.dueDate,
            billingMonth: latestBill.billingMonth,
          }
        : null,

      utilities: latestBill
        ? {
            water: {
              used: latestBill.waterUsedSnapshot,
              currentUnit: latestBill.currentWaterUnitSnapshot,
              prevUnit: latestBill.prevWaterUnitSnapshot,
            },

            electric: {
              used: latestBill.electricUsedSnapshot,
              currentUnit: latestBill.currentElectricUnitSnapshot,
              prevUnit: latestBill.prevElectricUnitSnapshot,
            },
          }
        : null,

      maintenance: {
        open: openMaint,
        inProgress: progressMaint,
        totalActive: Number(openMaint) + Number(progressMaint),
      },
    };
  },

  getBills: async (userId: string) => {
    const tenant = await prisma.tenantProfile.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!tenant) return [];

    return prisma.bill.findMany({
      where: {
        tenantId: tenant.id,
      },

      orderBy: {
        billingMonth: "desc",
      },

      include: {
        payment: true,
      },
    });
  },
};
