import { FastifyReply, FastifyRequest } from "fastify";
import { maintenanceService } from "./maintenance.service";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";

interface GetMaintenanceQuery {
  dormId: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

export const MaintenanceController = {
  getMaintenance: async (
    request: FastifyRequest<{
      Querystring: GetMaintenanceQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const user = request.user as UserDecodedDto;

    const {
      dormId,
      search,
      status,
      startDate,
      endDate,
      page = "1",
      limit = "10",
    } = request.query;

    if (!dormId) {
      return reply.status(400).send({
        message: "Dormitory ID is required",
      });
    }

    try {
      const result = await maintenanceService.getMaintenance(
        user,
        dormId,
        search,
        status,
        startDate,
        endDate,
        Number(page),
        Number(limit),
      );

      return reply.send(result);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "You are not the owner of this dormitory",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  updateStatus: async (
    request: FastifyRequest<{
      Params: MaintenanceParams;
      Body: UpdateStatusBody;
    }>,
    reply: FastifyReply,
  ) => {
    const user = request.user as UserDecodedDto;

    const { id } = request.params;

    const { status } = request.body;

    try {
      const result = await maintenanceService.updateStatus(user, id, status);
      return reply.send(result);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "NOT_FOUND") {
        return reply.status(404).send({
          message: "Maintenance request not found",
        });
      }

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "You don't have permission",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
