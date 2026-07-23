import { FastifyReply, FastifyRequest } from "fastify";
import { landmarkService } from "./landmark.service";
import logger from "@/utils/logger";
import { LandmarkTypeDto } from "@/modules/landmark/dto/landmark.dto";
import { AppError } from "@/lib/errors";
import { z } from "zod";

export const createLandmarkSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(LandmarkTypeDto),
  mapUrl: z.string(),
});

export const LandmarkController = {
  async getAllLandmarks(request: FastifyRequest, reply: FastifyReply) {
    const landmarks = await landmarkService.getAllLandmarks();
    return reply.send(landmarks);
  },

  async createLandmark(request: FastifyRequest, reply: FastifyReply) {
    const dto = createLandmarkSchema.parse(request.body);

    try {
      const landark = await landmarkService.createLandmark(dto as any);
      logger.info(dto);
      return reply.status(201).send(landark);
    } catch (error: any) {
      if (error.message === "INVALID_MAP_URL") {
        throw AppError.badRequest("INVALID_MAP_URL");
      }

      throw error;
    }
  },
};
