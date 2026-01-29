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
};
