import { FastifyRequest, FastifyReply } from "fastify";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { AnnouncementService } from "./announcement.service";
import prisma from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { z } from "zod";

interface GetAnnouncementsQuery {
  page?: string;
  limit?: string;
  dormitoryId: string;
}

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        order: z.number(),
      }),
    )
    .min(1),
});

export const AnnouncementController = {
  getOwnerAnnouncements: async (
    request: FastifyRequest<{
      Querystring: GetAnnouncementsQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const { page, limit, dormitoryId } = request.query;

    if (!dormitoryId) {
      throw AppError.badRequest(
        "DORMITORY_ID_REQUIRED",
        "กรุณาระบุ dormitoryId",
      );
    }

    const pageNumber = parseInt(page || "1", 10);
    const limitNumber = parseInt(limit || "10", 10);
    const result = await AnnouncementService.getOwnerAnnouncements(
      dormitoryId,
      pageNumber,
      limitNumber,
    );
    return reply.send(result);
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
      throw AppError.forbidden(
        "TENANT_NOT_FOUND",
        "ไม่พบข้อมูลผู้เช่า หรือคุณอาจย้ายออกไปแล้ว",
      );
    }

    if (!tenantProfile.room || !tenantProfile.room.dormitoryId) {
      throw AppError.badRequest(
        "TENANT_NOT_LINKED",
        "ข้อมูลผู้เช่ายังไม่ได้ถูกผูกกับห้องหรือหอพักใดๆ",
      );
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
  },

  createAnnouncement: async (request: FastifyRequest, reply: FastifyReply) => {
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
      throw AppError.badRequest("MISSING_FIELDS", "กรุณากรอกข้อมูลให้ครบ");
    }

    try {
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
      if (error.message === "FORBIDDEN") {
        throw AppError.forbidden(
          "FORBIDDEN",
          "not authorized to create announcement",
        );
      }

      throw error;
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
    const user = (request as any).user as UserDecodedDto;
    const ownerId = user.sub;
    const announcementId = request.params.id;
    const parts = request.parts();
    let title = "";
    let content = "";
    let type = "NORMAL";
    let removeImage = false;
    let isActive = true;
    let imageBuffer: Buffer | undefined = undefined;

    for await (const part of parts) {
      if (part.type === "field") {
        if (part.fieldname === "title") title = part.value as string;
        else if (part.fieldname === "content") content = part.value as string;
        else if (part.fieldname === "type") type = part.value as string;
        else if (part.fieldname === "removeImage")
          removeImage = part.value === "true";
        else if (part.fieldname === "isActive")
          isActive = part.value === "true";
      } else if (part.type === "file" && part.fieldname === "image") {
        imageBuffer = await part.toBuffer();
      }
    }

    if (!title) {
      throw AppError.badRequest("TITLE_REQUIRED", "กรุณาระบุหัวข้อประกาศ");
    }

    try {
      const result = await AnnouncementService.updateAnnouncement(
        announcementId,
        {
          ownerId,
          title,
          content,
          type: type as any,
          isActive,
          removeImage,
          imageBuffer,
        },
      );

      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "NOT_FOUND")
        throw AppError.notFound("NOT_FOUND", "ไม่พบประกาศ");

      if (error.message === "FORBIDDEN")
        throw AppError.forbidden("FORBIDDEN", "ไม่มีสิทธิ์แก้ไขประกาศนี้");

      throw error;
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
    const user = (request as any).user as UserDecodedDto;
    const ownerId = user.sub;
    const announcementId = request.params.id;

    try {
      await AnnouncementService.deleteAnnouncement(announcementId, ownerId);

      return reply.status(200).send({
        success: true,
        message: "ลบประกาศเรียบร้อยแล้ว",
      });
    } catch (error: any) {
      if (error.message === "NOT_FOUND")
        throw AppError.notFound("NOT_FOUND", "ไม่พบประกาศ");

      if (error.message === "FORBIDDEN")
        throw AppError.forbidden("FORBIDDEN", "ไม่มีสิทธิ์ลบประกาศนี้");

      throw error;
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
    const user = (request as any).user as UserDecodedDto;
    const ownerId = user.sub;
    const announcementId = request.params.id;

    try {
      const result = await AnnouncementService.togglePinAnnouncement(
        announcementId,
        ownerId,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "NOT_FOUND")
        throw AppError.notFound("NOT_FOUND", "ไม่พบประกาศ");

      if (error.message === "FORBIDDEN")
        throw AppError.forbidden("FORBIDDEN", "ไม่มีสิทธิ์จัดการประกาศนี้");

      throw error;
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
    const user = (request as any).user as UserDecodedDto;
    const ownerId = user.sub;

    const { items } = reorderSchema.parse(request.body);

    await AnnouncementService.reorderAnnouncements(items, ownerId);

    return reply.status(200).send({
      success: true,
    });
  },

  deleteImage: async (
    request: FastifyRequest<{
      Params: {
        imageId: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const user = (request as any).user as UserDecodedDto;
    const ownerId = user.sub;
    const imageId = request.params.imageId;

    try {
      await AnnouncementService.deleteImage(imageId, ownerId);

      return reply.status(200).send({
        success: true,
        message: "ลบรูปภาพสำเร็จ",
      });
    } catch (error: any) {
      if (error.message === "NOT_FOUND")
        throw AppError.notFound("NOT_FOUND", "ไม่พบรูปภาพ");

      if (error.message === "FORBIDDEN")
        throw AppError.forbidden("FORBIDDEN", "ไม่มีสิทธิ์ลบรูปภาพนี้");

      throw error;
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
    const { id } = request.params;

    const user = (request as any).user as UserDecodedDto;

    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: {
        userId: user.sub,
        isActive: true,
      },
    });

    if (!tenantProfile) {
      throw AppError.forbidden("TENANT_NOT_FOUND", "ไม่พบข้อมูลผู้เช่า");
    }

    await AnnouncementService.markAnnouncementAsRead(id, tenantProfile.id);

    return reply.send({
      success: true,
    });
  },
};
