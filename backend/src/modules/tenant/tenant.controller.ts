import logger from "@/utils/logger";
import { FastifyRequest, FastifyReply } from "fastify";
import { tenantService } from "@/modules/tenant/tenant.service";

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
};
