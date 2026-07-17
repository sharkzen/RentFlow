import { FastifyRequest, FastifyReply } from "fastify";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { roomService } from "./room.service";
import logger from "@/utils/logger";
import { RoomStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  createBulkRoomsSchema,
  generateBulkPdfSchema,
  toggleQrStatusSchema,
} from "./dto/room.schema";

interface GetRoomsQuery {
  status?: RoomStatus;
}

export const RoomController = {
  async getRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const query = request.query as any;

    const result = await roomService.getRoom(user, dormId, {
      search: query.search,
      status: query.status,
      type: query.type,
      floor: query.floor,
      page: Number(query.page || 1),
      limit: Number(query.limit || 10),
    });

    return reply.send(result);
  },

  async createBulk(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const body = createBulkRoomsSchema.parse(request.body);

    if (body.rooms.length === 0) {
      throw AppError.badRequest("NO_ROOMS_DATA");
    }

    try {
      const result = await roomService.createBulkRooms(user, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "OWNER_PROFILE_NOT_FOUND") {
        throw AppError.notFound("OWNER_PROFILE_NOT_FOUND");
      }

      if (error.message === "DORMITORY_NOT_FOUND") {
        throw AppError.forbidden("DORMITORY_NOT_FOUND_OR_FORBIDDEN");
      }

      throw error;
    }
  },

  async updateRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { roomId } = request.params as {
      roomId: string;
    };

    const body = request.body as any;

    try {
      const result = await roomService.updateRoom(user, roomId, body);
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        throw AppError.notFound("ROOM_NOT_FOUND");

      if (error.message === "DUPLICATE_ROOM_NUMBER")
        throw AppError.badRequest("DUPLICATE_ROOM_NUMBER");

      if (error.message === "FORBIDDEN_ACCESS")
        throw AppError.forbidden("FORBIDDEN");

      if (error.message === "CANNOT_CHANGE_STATUS_OCCUPIED") {
        throw AppError.badRequest("CANNOT_CHANGE_STATUS_OCCUPIED");
      }

      if (error.message === "CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY") {
        throw AppError.badRequest("CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY");
      }

      throw error;
    }
  },

  async getRooms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const query = request.query as GetRoomsQuery;

    try {
      const rooms = await roomService.getRooms(user, dormId, query.status);
      return reply.send(rooms);
    } catch (error: any) {
      if (error.message === "OWNER_PROFILE_NOT_FOUND") {
        throw AppError.forbidden("FORBIDDEN");
      }

      throw error;
    }
  },

  async deleteRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { roomId } = request.params as {
      roomId: string;
    };

    try {
      const result = await roomService.deleteRoom(user, roomId);
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        throw AppError.notFound("ROOM_NOT_FOUND");

      if (error.message === "FORBIDDEN_ACCESS")
        throw AppError.forbidden("FORBIDDEN");

      if (error.message === "CANNOT_DELETE_OCCUPIED_ROOM")
        throw AppError.badRequest("CANNOT_DELETE_OCCUPIED_ROOM");

      throw error;
    }
  },

  async createOrRenewQr(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { roomId } = request.params as {
      roomId: string;
    };

    try {
      const pdfBuffer = await roomService.createOrRenewQr(user, roomId);
      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename="qr-room-${roomId}.pdf"`,
      );
      return reply.send(pdfBuffer);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        throw AppError.notFound("ROOM_NOT_FOUND");

      if (error.message === "FORBIDDEN_ACCESS")
        throw AppError.forbidden("FORBIDDEN");

      if (error.message === "CANNOT_CREATE_QR_FOR_AVAILABLE_ROOM")
        throw AppError.badRequest(
          "CANNOT_CREATE_QR_FOR_AVAILABLE_ROOM",
          "ต้องมีผู้เช่าก่อนถึงจะสร้าง QR Code ได้",
        );

      throw error;
    }
  },

  async toggleQrStatus(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { roomId } = request.params as {
      roomId: string;
    };

    const body = toggleQrStatusSchema.parse(request.body);

    try {
      const result = await roomService.toggleQrStatus(
        user,
        roomId,
        body.isActive,
      );
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "QR_AUTH_NOT_FOUND")
        throw AppError.notFound("QR_AUTH_NOT_FOUND");

      if (error.message === "FORBIDDEN_ACCESS")
        throw AppError.forbidden("FORBIDDEN");

      throw error;
    }
  },

  async generateBulkPdf(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { roomIds } = generateBulkPdfSchema.parse(request.body);

    try {
      const { pdfBuffer, filename } = await roomService.generateBulkQrPdf(
        user.sub,
        roomIds,
      );

      const encodedFilename = encodeURIComponent(filename);
      reply.header("Content-Type", "application/pdf");

      reply.header(
        "Content-Disposition",
        `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      );

      return reply.send(pdfBuffer);
    } catch (error: any) {
      logger.error(error);

      if (error.message.includes("ไม่พบข้อมูลห้องพัก")) {
        throw AppError.forbidden("FORBIDDEN");
      }

      if (error.message.includes("ไม่มีห้องพักที่สามารถสร้าง")) {
        throw AppError.badRequest("NO_ROOMS_FOR_QR", error.message);
      }

      throw error;
    }
  },
};
