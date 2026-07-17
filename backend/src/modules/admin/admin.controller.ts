import { FastifyRequest, FastifyReply } from "fastify";
import { AdminService } from "./admin.service";
import { LandmarkType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const createLandmarkSchema = z.object({
  name: z.string(),
  type: z.string(),
  mapUrl: z.string(),
});

const updateLandmarkSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  mapUrl: z.string().optional(),
});

const togglePublishSchema = z.object({
  isPublished: z.boolean(),
});

const updateStatusSchema = z.object({
  status: z.string(),
});

export const AdminController = {
  getDashboard: async (req: FastifyRequest, reply: FastifyReply) => {
    const stats = await AdminService.getDashboardStats();
    return reply.code(200).send(stats);
  },

  getPendingList: async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, q = "" } = req.query as any;

    const result = await AdminService.getPendingOwners(
      Number(page),
      Number(limit),
      String(q),
    );
    return reply.code(200).send(result);
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
    const { isPublished } = togglePublishSchema.parse(req.body);

    const result = await AdminService.togglePublish(req.params.id, isPublished);
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
    const { status } = updateStatusSchema.parse(req.body);

    const result = await AdminService.updateStatus(req.params.id, status);
    return reply.send(result);
  },

  getOwners: async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, q = "", status = "ALL" } = req.query as any;

    const result = await AdminService.getOwnersList(
      Number(page),
      Number(limit),
      String(q),
      String(status),
    );
    return reply.send(result);
  },

  getOwnerById: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const result = await AdminService.getOwnerDetailById(req.params.id);

    if (!result) throw AppError.notFound("USER_NOT_FOUND", "User not found");

    return reply.send(result);
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
    const { status } = updateStatusSchema.parse(req.body);

    const result = await AdminService.updateUserStatus(
      req.params.id,
      status as any,
    );
    return reply.send(result);
  },

  getLandmarks: async (req: FastifyRequest, reply: FastifyReply) => {
    const { page = 1, limit = 10, q = "", type = "ALL" } = req.query as any;

    const result = await AdminService.getLandmarks(
      Number(page),
      Number(limit),
      String(q),
      String(type),
    );
    return reply.send(result);
  },

  createLandmark: async (req: FastifyRequest, reply: FastifyReply) => {
    const body = createLandmarkSchema.parse(req.body);

    try {
      const result = await AdminService.createLandmark({
        name: body.name,
        type: body.type as LandmarkType,
        mapUrl: body.mapUrl,
      });

      return reply.code(201).send(result);
    } catch (error: any) {
      if (error.message === "INVALID_MAP_URL") {
        throw AppError.badRequest(
          "INVALID_MAP_URL",
          "ไม่สามารถดึงพิกัดจากลิงก์ Google Maps ที่ระบุได้ กรุณาตรวจสอบลิงก์",
        );
      }

      throw error;
    }
  },

  updateLandmark: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        name?: string;
        type?: string;
        mapUrl?: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { id } = req.params;

    const body = updateLandmarkSchema.parse(req.body);

    try {
      const result = await AdminService.updateLandmark(id, {
        ...body,
        type: body.type as LandmarkType,
      });

      return reply.send(result);
    } catch (error: any) {
      if (error.message === "INVALID_MAP_URL") {
        throw AppError.badRequest(
          "INVALID_MAP_URL",
          "ไม่สามารถดึงพิกัดจากลิงก์ Google Maps ได้",
        );
      }

      throw error;
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
    await AdminService.deleteLandmark(req.params.id);

    return reply.send({
      success: true,
    });
  },
};
