import { FastifyRequest, FastifyReply } from "fastify";
import { AdminService } from "./admin.service";
import { LandmarkType } from "@prisma/client";

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

  getOwners: async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, q = "", status = "ALL" } = req.query as any;

    try {
      const result = await AdminService.getOwnersList(
        Number(page),
        Number(limit),
        String(q),
        String(status),
      );
      return reply.send(result);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  getOwnerById: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const result = await AdminService.getOwnerDetailById(req.params.id);

      if (!result)
        return reply.code(404).send({
          message: "User not found",
        });

      return reply.send(result);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  updateUserStatus: async (
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
    try {
      const result = await AdminService.updateUserStatus(
        req.params.id,
        req.body.status as any,
      );
      return reply.send(result);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  getLandmarks: async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, q = "", type = "ALL" } = req.query as any;

    try {
      const result = await AdminService.getLandmarks(
        Number(page),
        Number(limit),
        String(q),
        String(type),
      );
      return reply.send(result);
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  createLandmark: async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = req.body as {
        name: string;
        type: string;
        mapUrl: string;
      };

      if (!body.name || !body.mapUrl || !body.type) {
        return reply.code(400).send({
          message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        });
      }

      const result = await AdminService.createLandmark({
        name: body.name,
        type: body.type as LandmarkType,
        mapUrl: body.mapUrl,
      });

      return reply.code(201).send(result);
    } catch (error: any) {
      req.log.error(error);

      if (error.message === "INVALID_MAP_URL") {
        return reply.code(400).send({
          message:
            "ไม่สามารถดึงพิกัดจากลิงก์ Google Maps ที่ระบุได้ กรุณาตรวจสอบลิงก์",
        });
      }

      return reply.code(500).send({
        message: "Internal Server Error",
      });
    }
  },

  deleteLandmark: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      await AdminService.deleteLandmark(req.params.id);

      return reply.send({
        success: true,
      });
    } catch (error) {
      req.log.error(error);

      return reply.code(500).send({
        message: "Failed to delete landmark",
      });
    }
  },
};
