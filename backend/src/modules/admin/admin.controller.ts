import { FastifyRequest, FastifyReply } from "fastify";
import { AdminService } from "./admin.service";

export const AdminController = {
  getDashboard: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await AdminService.getDashboardStats();
      return reply.code(200).send(stats);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  getPendingList: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 10, q = "" } = req.query as any;

      const result = await AdminService.getPendingOwners(
        Number(page),
        Number(limit),
        String(q),
      );
      return reply.code(200).send(result);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  approve: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;

    await AdminService.approveOwner(id);

    return reply.send({
      success: true,
    });
  },

  reject: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;

    await AdminService.rejectOwner(id);

    return reply.send({
      success: true,
    });
  },

  getList: async (req: FastifyRequest, reply: FastifyReply) => {
    const {
      page = 1,
      limit = 10,
      q = "",
      status = "ALL",
      published = "all",
    } = req.query as any;

    const result = await AdminService.getDormitories(
      Number(page),
      Number(limit),
      String(q),
      String(status),
      String(published),
    );
    return reply.send(result);
  },

  getDetail: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await AdminService.getDormitoryDetail(req.params.id);
    return reply.send(result);
  },

  togglePublish: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        isPublished: boolean;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await AdminService.togglePublish(
      req.params.id,
      req.body.isPublished,
    );
    return reply.send(result);
  },

  updateStatus: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        status: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await AdminService.updateStatus(
      req.params.id,
      req.body.status,
    );
    return reply.send(result);
  },
};
