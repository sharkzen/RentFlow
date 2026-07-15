import { FastifyRequest, FastifyReply } from "fastify";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { roomService } from "./room.service";
import logger from "@/utils/logger";
import { CreateBulkRoomsDto } from "./dtos/room.dto";
import { RoomStatus } from "@prisma/client";

interface GetRoomsQuery {
  status?: RoomStatus;
}

export const RoomController = {
  async getRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    try {
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
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async createBulk(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) {
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });
    }

    try {
      const body = request.body as CreateBulkRoomsDto;

      if (!body.dormitoryId || !body.rooms || !Array.isArray(body.rooms)) {
        return reply.status(400).send({
          message: "INVALID_PAYLOAD",
        });
      }

      if (body.rooms.length === 0) {
        return reply.status(400).send({
          message: "NO_ROOMS_DATA",
        });
      }

      const result = await roomService.createBulkRooms(user, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "OWNER_PROFILE_NOT_FOUND") {
        return reply.status(404).send({
          message: "OWNER_PROFILE_NOT_FOUND",
        });
      }

      if (error.message === "DORMITORY_NOT_FOUND") {
        return reply.status(403).send({
          message: "DORMITORY_NOT_FOUND_OR_FORBIDDEN",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async updateRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    try {
      const { roomId } = request.params as {
        roomId: string;
      };

      const body = request.body as any;
      const result = await roomService.updateRoom(user, roomId, body);
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        return reply.status(404).send({
          message: "ROOM_NOT_FOUND",
        });

      if (error.message === "DUPLICATE_ROOM_NUMBER")
        return reply.status(400).send({
          message: "DUPLICATE_ROOM_NUMBER",
        });

      if (error.message === "FORBIDDEN_ACCESS")
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      if (error.message === "CANNOT_CHANGE_STATUS_OCCUPIED") {
        return reply.status(400).send({
          message: "CANNOT_CHANGE_STATUS_OCCUPIED",
        });
      }

      if (error.message === "CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY") {
        return reply.status(400).send({
          message: "CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async getRooms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) {
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });
    }

    const { dormId } = request.params as {
      dormId: string;
    };

    const query = request.query as GetRoomsQuery;

    try {
      const rooms = await roomService.getRooms(user, dormId, query.status);
      return reply.send(rooms);
    } catch (error: any) {
      if (error.message === "OWNER_PROFILE_NOT_FOUND") {
        return reply.status(403).send({
          message: "FORBIDDEN",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async deleteRoom(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    try {
      const { roomId } = request.params as {
        roomId: string;
      };

      const result = await roomService.deleteRoom(user, roomId);
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        return reply.status(404).send({
          message: "ROOM_NOT_FOUND",
        });

      if (error.message === "FORBIDDEN_ACCESS")
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      if (error.message === "CANNOT_DELETE_OCCUPIED_ROOM")
        return reply.status(400).send({
          message: "CANNOT_DELETE_OCCUPIED_ROOM",
        });

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
  async createOrRenewQr(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;
    if (!user) return reply.status(401).send({ message: "UNAUTHORIZED" });

    try {
      // รับ roomId จาก params (ไม่ใช่ body เพราะเป็นแบบรายห้อง)
      const { roomId } = request.params as { roomId: string };

      // เรียกใช้ Service เพื่อสร้าง/รีเซ็ต และรับ PDF Buffer กลับมา
      const pdfBuffer = await roomService.createOrRenewQr(user, roomId);

      // ตั้งค่า Headers สำหรับการดาวน์โหลดไฟล์ PDF
      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename="qr-room-${roomId}.pdf"`,
      );

      return reply.send(pdfBuffer);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "ROOM_NOT_FOUND")
        return reply.status(404).send({ message: "ROOM_NOT_FOUND" });
      if (error.message === "FORBIDDEN_ACCESS")
        return reply.status(403).send({ message: "FORBIDDEN" });
      if (error.message === "CANNOT_CREATE_QR_FOR_AVAILABLE_ROOM")
        return reply
          .status(400)
          .send({ message: "ต้องมีผู้เช่าก่อนถึงจะสร้าง QR Code ได้" });

      return reply.status(500).send({ message: "INTERNAL_SERVER_ERROR" });
    }
  },
  generatePdf: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { roomIds } = request.body as { roomIds: string[] };

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return reply.status(400).send({
        message: "กรุณาระบุห้องที่ต้องการสร้าง QR Code อย่างน้อย 1 รายการ",
      });
    }

    try {
      // เรียกใช้ Service เพื่อสร้าง PDF
      const { pdfBuffer, filename } = await roomService.generateBulkQrPdf(
        user.sub,
        roomIds,
      );

      const encodedFilename = encodeURIComponent(filename);

      // ส่งกลับเป็นไฟล์ PDF
      return reply
        .type("application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        )
        .send(pdfBuffer);
    } catch (error: any) {
      request.log.error(error);

      return reply.status(500).send({
        message: error.message || "ไม่สามารถสร้างไฟล์ PDF ได้",
      });
    }
  },

  async toggleQrStatus(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;
    if (!user) return reply.status(401).send({ message: "UNAUTHORIZED" });

    try {
      const { roomId } = request.params as { roomId: string };
      const body = request.body as { isActive: boolean };

      if (typeof body.isActive !== "boolean") {
        return reply.status(400).send({ message: "INVALID_PAYLOAD" });
      }

      const result = await roomService.toggleQrStatus(
        user,
        roomId,
        body.isActive,
      );
      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "QR_AUTH_NOT_FOUND")
        return reply.status(404).send({ message: "QR_AUTH_NOT_FOUND" });
      if (error.message === "FORBIDDEN_ACCESS")
        return reply.status(403).send({ message: "FORBIDDEN" });

      return reply.status(500).send({ message: "INTERNAL_SERVER_ERROR" });
    }
  },

  // หมายเหตุ: กรณีทำ PDF แนะนำให้โยน Data กลับไปให้หน้าบ้าน (Frontend) Render เป็น PDF ด้วยไลบรารีอย่าง `react-to-print` หรือ `@react-pdf/renderer` จะง่ายต่อการจัด Layout กว่าการให้ Backend วาด PDF ครับ
  async generateBulkPdf(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;
    if (!user) return reply.status(401).send({ message: "UNAUTHORIZED" });

    try {
      const body = request.body as { dormId: string; roomIds: string[] };

      if (!body.dormId || !body.roomIds || !Array.isArray(body.roomIds)) {
        return reply.status(400).send({ message: "INVALID_PAYLOAD" });
      }

      const roomsData = await roomService.getBulkQrData(user, body);

      // ส่งข้อมูล JSON กลับไปให้ Frontend ทำการ Generate PDF เอง
      return reply.send({
        success: true,
        data: roomsData,
      });
    } catch (error: any) {
      logger.error(error);

      if (
        error.message === "OWNER_PROFILE_NOT_FOUND" ||
        error.message === "DORMITORY_NOT_FOUND_OR_FORBIDDEN"
      ) {
        return reply.status(403).send({ message: "FORBIDDEN" });
      }

      return reply.status(500).send({ message: "INTERNAL_SERVER_ERROR" });
    }
  },
};
