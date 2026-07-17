import { FastifyRequest, FastifyReply } from "fastify";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { OwnerService } from "@/modules/owner/owner.service";
import {
  updateOwnerSchema,
  UpdateOwnerDto,
} from "@/modules/owner/validators/owner.validator";
import { AppError } from "@/lib/errors";

export const OwnerController = {
  async getOwnerInfo(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    try {
      const profile = await OwnerService.getOwnerProfile(user);
      return reply.status(200).send(profile);
    } catch (error: any) {
      if (error.message === "OWNER_NOT_FOUND") {
        throw AppError.notFound("OWNER_NOT_FOUND", "Owner profile not found");
      }

      throw error;
    }
  },

  async updateOwnerInfo(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;
    const dto = updateOwnerSchema.parse(request.body) as UpdateOwnerDto;

    try {
      const profile = await OwnerService.updateOwnerProfile(user, dto);
      return reply.status(200).send(profile);
    } catch (error: any) {
      if (error.message === "OWNER_NOT_FOUND") {
        throw AppError.notFound("OWNER_NOT_FOUND", "Owner profile not found");
      }

      throw error;
    }
  },
};
