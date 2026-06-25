import { FastifyRequest, FastifyReply } from "fastify";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { AnnouncementService } from "./announcement.service";
import prisma from "@/lib/prisma";

interface GetAnnouncementsQuery {
  page?: string;
  limit?: string;
  dormitoryId: string;
}

export const AnnouncementController = {
  getOwnerAnnouncements: async (
    request: FastifyRequest<{
      Querystring: GetAnnouncementsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { page, limit, dormitoryId } = request.query;

      if (!dormitoryId) {
        return reply.status(400).send({
          error: "กรุณาระบุ dormitoryId",
        });
      }

      const pageNumber = parseInt(page || "1", 10);
      const limitNumber = parseInt(limit || "10", 10);
      const result = await AnnouncementService.getOwnerAnnouncements(
        dormitoryId,
        pageNumber,
        limitNumber,
      );
      return reply.send(result);
    } catch (error) {
      logger.error(error);

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  getTenantAnnouncements: async (
    request: FastifyRequest<{
      Querystring: {
        page?: string;
        limit?: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { page, limit } = request.query;

      const user = (request as any).user as UserDecodedDto;

      const tenantProfile = await prisma.tenantProfile.findFirst({
        where: {
          userId: user.sub,
          isActive: true,
        },

        include: {
          room: true,
        },
      });

      if (!tenantProfile) {
        return reply.status(403).send({
          error: "ไม่พบข้อมูลผู้เช่า หรือคุณอาจย้ายออกไปแล้ว",
        });
      }

      if (!tenantProfile.room || !tenantProfile.room.dormitoryId) {
        return reply.status(400).send({
          error: "ข้อมูลผู้เช่ายังไม่ได้ถูกผูกกับห้องหรือหอพักใดๆ",
        });
      }

      const dormitoryId = tenantProfile.room.dormitoryId;
      const tenantId = tenantProfile.id;
      const pageNumber = parseInt(page || "1", 10);
      const limitNumber = parseInt(limit || "50", 10);
      const result = await AnnouncementService.getTenantAnnouncements(
        dormitoryId,
        tenantId,
        pageNumber,
        limitNumber,
      );
      return reply.send(result);
    } catch (error) {
      logger.error(error);

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  createAnnouncement: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;
      const parts = request.parts();
      let dormitoryId = "";
      let title = "";
      let content = "";
      let type = "NORMAL";
      let sendEmail = true;
      let imageBuffer: Buffer | undefined = undefined;
      let imageMimeType: string | undefined = undefined;

      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "dormitoryId")
            dormitoryId = part.value as string;

          if (part.fieldname === "title") title = part.value as string;

          if (part.fieldname === "content") content = part.value as string;

          if (part.fieldname === "type") type = part.value as string;

          if (part.fieldname === "sendEmail") sendEmail = part.value === "true";
        } else if (part.type === "file" && part.fieldname === "image") {
          imageBuffer = await part.toBuffer();
          imageMimeType = part.mimetype;
        }
      }

      if (!dormitoryId || !title || !content) {
        return reply.status(400).send({
          error: "กรุณากรอกข้อมูลให้ครบ",
        });
      }

      const result = await AnnouncementService.createAnnouncement({
        dormitoryId,
        ownerId,
        title,
        content,
        type: type as any,
        sendEmail,
        imageBuffer,
      });

      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "FORBIDDEN") {
        return reply.status(403).send({
          error: "not authorized to create announcement",
        });
      }

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  updateAnnouncement: async (
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;
      const announcementId = request.params.id;
      const parts = request.parts();
      let title = "";
      let content = "";
      let type = "NORMAL";
      let removeImage = false;
      let imageBuffer: Buffer | undefined = undefined;

      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "title") title = part.value as string;
          else if (part.fieldname === "content") content = part.value as string;
          else if (part.fieldname === "type") type = part.value as string;
          else if (part.fieldname === "removeImage")
            removeImage = part.value === "true";
        } else if (part.type === "file" && part.fieldname === "image") {
          imageBuffer = await part.toBuffer();
        }
      }

      if (!title) {
        return reply.status(400).send({
          error: "กรุณาระบุหัวข้อประกาศ",
        });
      }

      const result = await AnnouncementService.updateAnnouncement(
        announcementId,
        {
          ownerId,
          title,
          content,
          type: type as any,
          removeImage,
          imageBuffer,
        },
      );

      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "NOT_FOUND")
        return reply.status(404).send({
          error: "ไม่พบประกาศ",
        });

      if (error.message === "FORBIDDEN")
        return reply.status(403).send({
          error: "ไม่มีสิทธิ์แก้ไขประกาศนี้",
        });

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  deleteAnnouncement: async (
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;
      const announcementId = request.params.id;
      await AnnouncementService.deleteAnnouncement(announcementId, ownerId);

      return reply.status(200).send({
        success: true,
        message: "ลบประกาศเรียบร้อยแล้ว",
      });
    } catch (error: any) {
      logger.error(error);

      if (error.message === "NOT_FOUND")
        return reply.status(404).send({
          error: "ไม่พบประกาศ",
        });

      if (error.message === "FORBIDDEN")
        return reply.status(403).send({
          error: "ไม่มีสิทธิ์ลบประกาศนี้",
        });

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  togglePinAnnouncement: async (
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;
      const announcementId = request.params.id;
      const result = await AnnouncementService.togglePinAnnouncement(
        announcementId,
        ownerId,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "NOT_FOUND")
        return reply.status(404).send({
          error: "ไม่พบประกาศ",
        });

      if (error.message === "FORBIDDEN")
        return reply.status(403).send({
          error: "ไม่มีสิทธิ์จัดการประกาศนี้",
        });

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  reorderAnnouncements: async (
    request: FastifyRequest<{
      Body: {
        items: {
          id: string;
          order: number;
        }[];
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;

      const { items } = request.body;

      if (!items || !Array.isArray(items)) {
        return reply.status(400).send({
          error: "Invalid payload",
        });
      }

      await AnnouncementService.reorderAnnouncements(items, ownerId);

      return reply.status(200).send({
        success: true,
      });
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  deleteImage: async (
    request: FastifyRequest<{
      Params: {
        imageId: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = (request as any).user as UserDecodedDto;
      const ownerId = user.sub;
      const imageId = request.params.imageId;
      await AnnouncementService.deleteImage(imageId, ownerId);

      return reply.status(200).send({
        success: true,
        message: "ลบรูปภาพสำเร็จ",
      });
    } catch (error: any) {
      logger.error(error);

      if (error.message === "NOT_FOUND")
        return reply.status(404).send({
          error: "ไม่พบรูปภาพ",
        });

      if (error.message === "FORBIDDEN")
        return reply.status(403).send({
          error: "ไม่มีสิทธิ์ลบรูปภาพนี้",
        });

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },

  markAsRead: async (
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const { id } = request.params;

      const user = (request as any).user as UserDecodedDto;

      const tenantProfile = await prisma.tenantProfile.findFirst({
        where: {
          userId: user.sub,
          isActive: true,
        },
      });

      if (!tenantProfile) {
        return reply.status(403).send({
          error: "ไม่พบข้อมูลผู้เช่า",
        });
      }

      await AnnouncementService.markAnnouncementAsRead(id, tenantProfile.id);

      return reply.send({
        success: true,
      });
    } catch (error) {
      logger.error(error);

      return reply.status(500).send({
        error: "Internal Server Error",
      });
    }
  },
};
