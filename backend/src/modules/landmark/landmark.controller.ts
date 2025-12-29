import { FastifyReply, FastifyRequest } from "fastify";
import { landmarkService } from "./landmark.service";
import logger from "@/utils/logger";
import { LandmarkDto } from "@/modules/landmark/dto/landark.dto";
export const LandmarkController = {
  async getAllLandmarks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const landmarks = await landmarkService.getAllLandmarks();
      return reply.send(landmarks);
    } catch (error: any) {
      logger.error(error.message);
      return reply.status(500).send({ message: "INTERNAL_SERVER_ERROR" });
    }
  },
  async createLandmark(request: FastifyRequest, reply: FastifyReply) {
    try {
      const dto = request.body as LandmarkDto;
      const landark = await landmarkService.createLandmark(dto);
      logger.info(dto);
      return reply.status(201).send(landark);
    } catch (error: any) {
      logger.error(error.message);
      if (error.message === "INVALID_MAP_URL") {
        return reply.status(400).send({ message: "INVALID_MAP_URL" });
      }
      return reply.status(500).send({ message: "INTERNAL_SERVER_ERROR" });
    }
  },
};
