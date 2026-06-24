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

      const user = (request as any).user as UserDecodedDto;

      const tenantProfile = await prisma.tenantProfile.findFirst({
        where: {
          userId: user.sub,
        },
      });

      if (!tenantProfile) {
        return reply.status(403).send({
          error: "ไม่พบข้อมูลผู้เช่า",
        });
      }

      const pageNumber = parseInt(page || "1", 10);
      const limitNumber = parseInt(limit || "10", 10);
      const result = await AnnouncementService.getTenantAnnouncements(
        dormitoryId,
        tenantProfile.id,
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
      const parts = request.parts(); // iterate multipart parts

      let dormitoryId = "";
      let title = "";
      let content = "";
      let type = "NORMAL";
      let sendEmail = true;
      let imageFile: any = null;

      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "dormitoryId")
            dormitoryId = part.value as string;
          if (part.fieldname === "title") title = part.value as string;
          if (part.fieldname === "content") content = part.value as string;
          if (part.fieldname === "type") type = part.value as string;
          if (part.fieldname === "sendEmail") sendEmail = part.value === "true";
        } else if (part.type === "file" && part.fieldname === "image") {
          imageFile = part; // เก็บ stream ไว้
        }
      }

      if (!dormitoryId || !title || !content) {
        return reply.status(400).send({ error: "กรุณากรอกข้อมูลให้ครบ" });
      }

      const result = await AnnouncementService.createAnnouncement({
        dormitoryId,
        title,
        content,
        type: type as any,
        sendEmail,
        imageFile,
      });

      return reply.status(201).send(result);
    } catch (error) {
      logger.error(error);
      return reply.status(500).send({ error: "Internal Server Error" });
    }
  },
};
