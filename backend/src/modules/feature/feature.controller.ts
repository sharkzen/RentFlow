import { FastifyRequest, FastifyReply } from "fastify";
import { FeatureService } from "./feature.service";

export const featureController = {
  getAllFeatures: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await FeatureService.getAllFeatures();
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  getFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { key } = request.params as {
        key: string;
      };

      const result = await FeatureService.getFeature(key);

      if (!result.success) return reply.status(404).send(result);

      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  createFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        key: string;
        name: string;
        description?: string;
        enabled?: boolean;
      };

      if (!body.key || !body.name) {
        return reply.status(400).send({
          success: false,
          message: "KEY_AND_NAME_ARE_REQUIRED",
        });
      }

      const result = await FeatureService.createFeature(body);
      return reply.status(201).send(result);
    } catch (error: any) {
      const statusCode = error.message === "FEATURE_ALREADY_EXISTS" ? 409 : 500;

      return reply.status(statusCode).send({
        success: false,
        message: error.message,
      });
    }
  },

  updateFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { key } = request.params as {
        key: string;
      };

      const body = request.body as {
        name?: string;
        description?: string;
        enabled?: boolean;
      };

      if (Object.keys(body).length === 0) {
        return reply.status(400).send({
          success: false,
          message: "NO_DATA_PROVIDED_FOR_UPDATE",
        });
      }

      const result = await FeatureService.updateFeature(key, body);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },

  deleteFeature: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { key } = request.params as {
        key: string;
      };

      const result = await FeatureService.deleteFeature(key);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  },
};
