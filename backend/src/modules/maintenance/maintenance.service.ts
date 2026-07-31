import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { generateSignedUrl } from "@/services/r2Client";
import { MaintenanceStatus } from "@prisma/client";
import { createActivityLog } from "@/services/activity-log.service";
import { decrypt } from "@/utils/encryption";
import { EmailType } from "@/queues/email.types";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import logger from "@/utils/logger";
import { env } from "@/config/env";
import { UserRole } from "@prisma/client";
import { maintenanceMessageService } from "./maintenance-message.service";

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
    if (dormId && dormId !== "ALL") {
      const isOwner = await prisma.dormitory.findFirst({
        where: {
          id: dormId,

          owner: {
            userId: user.sub,
          },
        },
      });

      if (!isOwner) throw new Error("FORBIDDEN_ACCESS");
    }

    const whereCondition: any = {};

    if (dormId && dormId !== "ALL") {
      whereCondition.dormitoryId = dormId;
    } else {
      whereCondition.dormitory = {
        owner: {
          userId: user.sub,
        },
      };
    }

    if (status && (status as string) !== "ALL") {
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
        dormitory: {
          select: {
            name: true,
          },
        },

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

        const decryptedTenant = request.tenant
          ? {
              ...request.tenant,
              phone: decrypt(request.tenant.phone),
            }
          : null;

        return {
          ...request,
          tenant: decryptedTenant,
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
    status: MaintenanceStatus,
    note?: string,
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

        tenant: {
          include: {
            user: true,
          },
        },

        room: true,
      },
    });

    if (!existingRequest) throw new Error("NOT_FOUND");

    if (existingRequest.dormitory.owner.userId !== user.sub)
      throw new Error("FORBIDDEN_ACCESS");

    const updatedRequest = await prisma.maintenanceRequest.update({
      where: {
        id: maintenanceId,
      },

      data: {
        status: status,
        ownerNote: note || null,
      },
    });

    const tenantEmail = existingRequest.tenant.user.email;

    if (tenantEmail) {
      let emailType: EmailType | null = null;
      let defaultNote = "";

      if (status === "IN_PROGRESS") {
        emailType = EmailType.MAINTENANCE_IN_PROGRESS;
        defaultNote = "รับเรื่องแจ้งซ่อมเรียบร้อยแล้ว";
      } else if (status === "CANCELLED") {
        emailType = EmailType.MAINTENANCE_CANCELLED;
        defaultNote =
          "ทางหอพักได้ยกเลิกรายการแจ้งซ่อมนี้ (ไม่มีข้อความเพิ่มเติม)";
      } else if (status === "COMPLETED") {
        emailType = EmailType.MAINTENANCE_COMPLETED;
        defaultNote = "ดำเนินการซ่อมแซมเรียบร้อยแล้ว";
      }

      if (emailType) {
        try {
          await emailQueue.add(EMAIL_JOB_NAME, {
            type: emailType,
            to: tenantEmail,
            senderName: existingRequest.dormitory.name,

            data: {
              dormName: existingRequest.dormitory.name,
              roomNumber: existingRequest.room.roomNumber,
              tenantName: existingRequest.tenant.firstName,
              title: existingRequest.title,
              note: note || defaultNote,
              link: `${env.FRONTEND_URL}/tenant/maintenance`,
            },
          });
        } catch (err) {
          logger.error(`[Email Queue] Error: ${err}`);
        }
      }
    }

    await createActivityLog({
      userId: user.sub,
      action: "UPDATE_MAINTENANCE_STATUS",
      entityType: "MaintenanceRequest",
      entityId: maintenanceId,

      metadata: {
        title: existingRequest.title,
        oldStatus: existingRequest.status,
        newStatus: status,
        note: note,
      },
    });

    return updatedRequest;
  },

  sendMessage: async (
    user: UserDecodedDto,
    maintenanceId: string,
    message: string,
  ) => {
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },

      include: {
        dormitory: { include: { owner: { include: { user: true } } } },
        tenant: { include: { user: true } },
        room: true,
      },
    });

    if (!existingRequest) throw new Error("NOT_FOUND");

    if (existingRequest.dormitory.owner.userId !== user.sub)
      throw new Error("FORBIDDEN_ACCESS");

    return maintenanceMessageService.createAndNotify({
      existingRequest,
      senderRole: UserRole.OWNER,
      senderUserId: user.sub,
      senderName: existingRequest.dormitory.name,
      message,
    });
  },

  getMessages: async (user: UserDecodedDto, maintenanceId: string) => {
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },
      include: { dormitory: { include: { owner: true } } },
    });

    if (!existingRequest) throw new Error("NOT_FOUND");

    if (existingRequest.dormitory.owner.userId !== user.sub)
      throw new Error("FORBIDDEN_ACCESS");

    return maintenanceMessageService.getMessages(maintenanceId);
  },

  editMessage: async (
    user: UserDecodedDto,
    maintenanceId: string,
    messageId: string,
    message: string,
  ) => {
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },
      include: { dormitory: { include: { owner: true } } },
    });

    if (!existingRequest) throw new Error("NOT_FOUND");

    if (existingRequest.dormitory.owner.userId !== user.sub)
      throw new Error("FORBIDDEN_ACCESS");

    return maintenanceMessageService.updateMessage({
      maintenanceId,
      messageId,
      senderUserId: user.sub,
      message,
    });
  },
};
