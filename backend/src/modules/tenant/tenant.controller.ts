import logger from "@/utils/logger";
import { FastifyRequest, FastifyReply } from "fastify";
import { tenantService } from "@/modules/tenant/tenant.service";
import { UserDecodedDto } from "../auth/dto/user.dto";

interface GetTenantDormQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export const TenantController = {
  getTenantDorm: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { dormId } = request.params as {
        dormId?: string;
      };

      if (!dormId) {
        return reply.status(400).send({
          message: "DORM_ID_REQUIRED",
        });
      }

      const { sub } = request.user as {
        sub?: string;
      };

      if (!sub) {
        return reply.status(401).send({
          message: "UNAUTHORIZED",
        });
      }

      const { page, limit, search } = request.query as GetTenantDormQuery;

      const result = await tenantService.getTenantDorm({
        dormId,
        sub,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search?.trim() || undefined,
      });

      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
  createTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const body = request.body as any; // หรือสร้าง DTO มา validate

      // Validate เบื้องต้น
      if (!body.email || !body.roomId || !body.firstName) {
        return reply.status(400).send({ message: "MISSING_REQUIRED_FIELDS" });
      }

      const result = await tenantService.createTenant(user.sub, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      // Map Error Message เป็น Code เพื่อให้ Frontend เอาไป render
      switch (error.message) {
        case "EMAIL_ALREADY_EXISTS":
          return reply.status(409).send({
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email is already in use",
          });
        case "ROOM_NOT_AVAILABLE":
          return reply.status(409).send({
            code: "ROOM_NOT_AVAILABLE",
            message: "Room is not available",
          });
        case "OWNER_PROFILE_NOT_FOUND":
          return reply.status(403).send({
            code: "OWNER_PROFILE_NOT_FOUND",
            message: "Forbidden",
          });
        case "DORM_NOT_OWNED":
          return reply.status(403).send({
            code: "DORM_NOT_OWNED",
            message: "You are not the owner of this dorm",
          });
        default:
          return reply.status(500).send({
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error",
          });
      }
    }
  },
};
