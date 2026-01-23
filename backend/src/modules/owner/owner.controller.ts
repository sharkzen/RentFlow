import { FastifyRequest, FastifyReply } from "fastify";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import logger from "@/utils/logger";
import { OwnerService } from "@/modules/owner/owner.service";
import {
  updateOwnerSchema,
  UpdateOwnerDto,
} from "@/modules/owner/validators/owner.validator";

export const OwnerController = {
  async getOwnerInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as UserDecodedDto;
      const profile = await OwnerService.getOwnerProfile(user);
      return reply.status(200).send(profile);
    } catch (error: any) {
      logger.error(`Get Owner Error [User: ${request.user?.sub}]:`, error);

      if (error.message === "OWNER_NOT_FOUND") {
        return reply.status(404).send({
          message: "Owner profile not found",
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  async updateOwnerInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as UserDecodedDto;
      const body = request.body;
      logger.info(body);
      const parseResult = updateOwnerSchema.safeParse(body);

      if (!parseResult.success) {
        return reply.status(400).send({
          message: "Validation Error",
          errors: parseResult.error.format(),
        });
      }

      const dto = parseResult.data as UpdateOwnerDto;
      const profile = await OwnerService.updateOwnerProfile(user, dto);
      return reply.status(200).send(profile);
    } catch (error: any) {
      logger.error(`Update Owner Error [User: ${request.user?.sub}]: ${error}`);

      if (error.message === "OWNER_NOT_FOUND") {
        return reply.status(404).send({
          message: "Owner profile not found",
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },
};
