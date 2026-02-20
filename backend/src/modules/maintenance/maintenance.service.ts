import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { generateSignedUrl } from "@/services/r2Client";
import { MaintenanceStatus } from "@prisma/client";
import { createActivityLog } from "@/services/activity-log.service";

export const maintenanceService = {
  getMaintenance: async (
    user: UserDecodedDto,
    dormId: string,
    search?: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    const isOwner = await prisma.dormitory.findFirst({
      where: {
        id: dormId,

        owner: {
          userId: user.sub,
        },
      },
    });

    if (!isOwner) throw new Error("FORBIDDEN_ACCESS");

    const whereCondition: any = {
      dormitoryId: dormId,
    };

    if (status && status !== "ALL") {
      whereCondition.status = status as MaintenanceStatus;
    }

    if (startDate || endDate) {
      whereCondition.createdAt = {};

      if (startDate) {
        whereCondition.createdAt.gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereCondition.createdAt.lte = end;
      }
    }

    if (search) {
      whereCondition.OR = [
        {
          title: {
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
          tenant: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          tenant: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const total = await prisma.maintenanceRequest.count({
      where: whereCondition,
    });

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: whereCondition,

      include: {
        room: {
          select: {
            roomNumber: true,
            floor: true,
          },
        },

        tenant: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },

        images: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      maintenanceRequests.map(async (request) => {
        const imagesWithUrls = await Promise.all(
          request.images.map(async (image) => ({
            ...image,
            url: await generateSignedUrl(image.objectKey),
          })),
        );

        return {
          ...request,
          images: imagesWithUrls,
        };
      }),
    );

    return {
      data,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  updateStatus: async (
    user: UserDecodedDto,
    maintenanceId: string,
    status: string,
  ) => {
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: {
        id: maintenanceId,
      },

      include: {
        dormitory: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!existingRequest) {
      throw new Error("NOT_FOUND");
    }

    if (existingRequest.dormitory.owner.userId !== user.sub) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    const updatedRequest = await prisma.maintenanceRequest.update({
      where: {
        id: maintenanceId,
      },

      data: {
        status: status as MaintenanceStatus,
      },
    });

    await createActivityLog({
      userId: user.sub,
      action: "UPDATE_MAINTENANCE_STATUS",
      entityType: "MaintenanceRequest",
      entityId: maintenanceId,

      metadata: {
        title: existingRequest.title,
        oldStatus: existingRequest.status,
        newStatus: status,
      },
    });

    return updatedRequest;
  },
};
