import { FastifyRequest, FastifyReply } from "fastify";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { roomService } from "./room.service";
import logger from "@/utils/logger";

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
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
      });

      return reply.send(result);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "OWNER_PROFILE_NOT_FOUND")
        return reply.status(404).send({
          message: "OWNER_PROFILE_NOT_FOUND",
        });

      if (error.message === "DORMITORY_NOT_FOUND")
        return reply.status(404).send({
          message: "DORMITORY_NOT_FOUND",
        });

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
