import { FastifyRequest, FastifyReply } from "fastify";
import { FeatureService } from "./feature.service";
import { AppError } from "@/lib/errors";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { z } from "zod";

export const createFeatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const updateFeatureSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "NO_DATA_PROVIDED_FOR_UPDATE",
  });

export const featureController = {
  getAllFeatures: async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await FeatureService.getAllFeatures();
    return reply.send(result);
  },

  getFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as {
      key: string;
    };

    const result = await FeatureService.getFeature(key);

    if (!result.success) throw AppError.notFound("FEATURE_NOT_FOUND");

    return reply.send(result);
  },

  createFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createFeatureSchema.parse(request.body);
    const user = request.user as UserDecodedDto;

    try {
      const result = await FeatureService.createFeature(body, user.sub);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.message === "FEATURE_ALREADY_EXISTS") {
        throw AppError.conflict("FEATURE_ALREADY_EXISTS");
      }

      throw error;
    }
  },

  updateFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as {
      key: string;
    };

    const parsed = updateFeatureSchema.safeParse(request.body);

    if (!parsed.success) {
      throw AppError.badRequest("NO_DATA_PROVIDED_FOR_UPDATE");
    }

    const user = request.user as UserDecodedDto;

    try {
      const result = await FeatureService.updateFeature(
        key,
        parsed.data,
        user.sub,
      );
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FAILED_TO_UPDATE_FEATURE") {
        throw AppError.notFound("FEATURE_NOT_FOUND", "ไม่พบฟีเจอร์นี้");
      }

      throw error;
    }
  },

  deleteFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as {
      key: string;
    };

    const user = request.user as UserDecodedDto;

    try {
      const result = await FeatureService.deleteFeature(key, user.sub);
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FAILED_TO_DELETE_FEATURE") {
        throw AppError.notFound("FEATURE_NOT_FOUND", "ไม่พบฟีเจอร์นี้");
      }

      throw error;
    }
  },
};
