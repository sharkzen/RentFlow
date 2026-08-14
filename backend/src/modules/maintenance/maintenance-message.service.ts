import prisma from "@/lib/prisma";
import { MaintenanceRequest, UserRole } from "@prisma/client";
import { createActivityLog } from "@/services/activity-log.service";
import { EmailType } from "@/queues/email.types";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import logger from "@/utils/logger";
import { env } from "@/config/env";

type MaintenanceRequestWithParties = MaintenanceRequest & {
  dormitory: { name: string; owner: { userId: string; user: { email: string } } };
  tenant: { firstName: string; lastName: string; user: { email: string } };
  room: { roomNumber: string };
};

export const maintenanceMessageService = {
  getMessages: async (maintenanceId: string) => {
    return prisma.maintenanceMessage.findMany({
      where: { maintenanceId },
      orderBy: { createdAt: "asc" },
    });
  },

  createAndNotify: async ({
    existingRequest,
    senderRole,
    senderUserId,
    senderName,
    message,
  }: {
    existingRequest: MaintenanceRequestWithParties;
    senderRole: UserRole;
    senderUserId: string;
    senderName: string;
    message: string;
  }) => {
    if (existingRequest.status !== "IN_PROGRESS") {
      throw new Error("INVALID_STATUS");
    }

    const created = await prisma.maintenanceMessage.create({
      data: {
        maintenanceId: existingRequest.id,
        senderRole,
        senderId: senderUserId,
        message,
      },
    });

    const isOwnerSender = senderRole === UserRole.OWNER;
    const recipientEmail = isOwnerSender
      ? existingRequest.tenant.user.email
      : existingRequest.dormitory.owner.user.email;

    if (recipientEmail) {
      try {
        await emailQueue.add(EMAIL_JOB_NAME, {
          type: EmailType.MAINTENANCE_NEW_MESSAGE,
          to: recipientEmail,
          senderName: existingRequest.dormitory.name,

          data: {
            dormName: existingRequest.dormitory.name,
            roomNumber: existingRequest.room.roomNumber,
            title: existingRequest.title,
            senderName,
            senderRoleLabel: isOwnerSender ? "เจ้าของหอ" : "ผู้เช่า",
            message,
            link: isOwnerSender
              ? `${env.FRONTEND_URL}/tenant/maintenance`
              : `${env.FRONTEND_URL}/owner/maintenance?requestId=${existingRequest.id}`,
          },
        });
      } catch (err) {
        logger.error(`[Email Queue] Error: ${err}`);
      }
    }

    await createActivityLog({
      userId: senderUserId,
      action: "SEND_MAINTENANCE_MESSAGE",
      entityType: "MaintenanceRequest",
      entityId: existingRequest.id,

      metadata: {
        senderRole,
        messagePreview: message.slice(0, 200),
      },
    });

    return created;
  },

  updateMessage: async ({
    maintenanceId,
    messageId,
    senderUserId,
    message,
  }: {
    maintenanceId: string;
    messageId: string;
    senderUserId: string;
    message: string;
  }) => {
    const existingMessage = await prisma.maintenanceMessage.findUnique({
      where: { id: messageId },
      include: { maintenance: true },
    });

    if (!existingMessage || existingMessage.maintenanceId !== maintenanceId) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    if (existingMessage.senderId !== senderUserId) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (existingMessage.maintenance.status !== "IN_PROGRESS") {
      throw new Error("INVALID_STATUS");
    }

    return prisma.maintenanceMessage.update({
      where: { id: messageId },
      data: { message, editedAt: new Date() },
    });
  },
};
