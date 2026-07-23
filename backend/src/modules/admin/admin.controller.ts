import { FastifyRequest, FastifyReply } from "fastify";
import { AdminService } from "./admin.service";
import { LandmarkType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { z } from "zod";

export const createLandmarkSchema = z.object({
  name: z.string(),
  type: z.string(),
  mapUrl: z.string(),
});

export const updateLandmarkSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  mapUrl: z.string().optional(),
});

export const togglePublishSchema = z.object({
  isPublished: z.boolean(),
});

export const toggleFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

export const reorderFeaturedSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    }),
  ),
});

export const updateStatusSchema = z.object({
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
    const user = req.user as UserDecodedDto;

    await AdminService.approveOwner(id, user.sub);

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
    const user = req.user as UserDecodedDto;

    await AdminService.rejectOwner(id, user.sub);

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
      featured = "all",
    } = req.query as any;

    const result = await AdminService.getDormitories(
      Number(page),
      Number(limit),
      String(q),
      String(status),
      String(published),
      String(featured),
    );
    return reply.send(result);
  },

  getFeaturedList: async (req: FastifyRequest, reply: FastifyReply) => {
    const result = await AdminService.getFeaturedDormitories();
    return reply.send(result);
  },

  toggleFeatured: async (
    req: FastifyRequest<{
      Params: {
        id: string;
      };
      Body: {
        isFeatured: boolean;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const { isFeatured } = toggleFeaturedSchema.parse(req.body);
    const user = req.user as UserDecodedDto;

    const result = await AdminService.toggleFeatured(
      req.params.id,
      isFeatured,
      user.sub,
    );
    return reply.send(result);
  },

  reorderFeatured: async (req: FastifyRequest, reply: FastifyReply) => {
    const { items } = reorderFeaturedSchema.parse(req.body);
    const user = req.user as UserDecodedDto;

    const result = await AdminService.reorderFeatured(items, user.sub);
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
    const user = req.user as UserDecodedDto;

    const result = await AdminService.togglePublish(
      req.params.id,
      isPublished,
      user.sub,
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
    const { status } = updateStatusSchema.parse(req.body);
    const user = req.user as UserDecodedDto;

    const result = await AdminService.updateStatus(
      req.params.id,
      status,
      user.sub,
    );
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
    const user = req.user as UserDecodedDto;

    const result = await AdminService.updateUserStatus(
      req.params.id,
      status as any,
      user.sub,
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
    const user = req.user as UserDecodedDto;

    try {
      const result = await AdminService.createLandmark(
        {
          name: body.name,
          type: body.type as LandmarkType,
          mapUrl: body.mapUrl,
        },
        user.sub,
      );

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
    const user = req.user as UserDecodedDto;

    const body = updateLandmarkSchema.parse(req.body);

    try {
      const result = await AdminService.updateLandmark(
        id,
        {
          ...body,
          type: body.type as LandmarkType,
        },
        user.sub,
      );

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
    const user = req.user as UserDecodedDto;
    await AdminService.deleteLandmark(req.params.id, user.sub);

    return reply.send({
      success: true,
    });
  },
};
