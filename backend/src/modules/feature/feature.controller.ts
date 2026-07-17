import { FastifyRequest, FastifyReply } from "fastify";
import { FeatureService } from "./feature.service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const createFeatureSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
});

const updateFeatureSchema = z
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

    try {
      const result = await FeatureService.createFeature(body);
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

    const result = await FeatureService.updateFeature(key, parsed.data);
    return reply.send(result);
  },

  deleteFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as {
      key: string;
    };

    const result = await FeatureService.deleteFeature(key);
    return reply.send(result);
  },
};
