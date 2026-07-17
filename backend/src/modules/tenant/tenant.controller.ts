import logger from "@/utils/logger";
import { FastifyRequest, FastifyReply } from "fastify";
import { tenantService } from "@/modules/tenant/tenant.service";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { AppError } from "@/lib/errors";

import {
  getTenantDormQuerySchema,
  getMyBillsQuerySchema,
  createTenantSchema,
  updateTenantSchema,
  moveOutSchema,
  generateQrPaymentSchema,
  reEntryTenantSchema,
} from "./dto/tenant.schema";

interface GetMaintenanceQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

const getMultipartValue = (field: any): string => {
  if (!field) return "";

  if (typeof field === "string") return field;

  if (field.value !== undefined) return String(field.value);

  if (Array.isArray(field) && field.length > 0) {
    const lastItem = field[field.length - 1];
    return lastItem.value !== undefined
      ? String(lastItem.value)
      : String(lastItem);
  }

  return String(field);
};

export const TenantController = {
  getTenantDorm: async (request: FastifyRequest, reply: FastifyReply) => {
    const { dormId } = request.params as {
      dormId?: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
    }

    const { sub } = request.user as {
      sub?: string;
    };

    if (!sub) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    const { page, limit, search, status } = getTenantDormQuerySchema.parse(
      request.query,
    );

    const result = await tenantService.getTenantDorm({
      dormId,
      sub,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search: search?.trim() || undefined,
      status: status || "active",
    });

    return reply.status(200).send(result);
  },

  createTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const body = createTenantSchema.parse(request.body);

    try {
      const result = await tenantService.createTenant(user.sub, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "EMAIL_ALREADY_EXISTS":
          throw AppError.conflict(
            "EMAIL_ALREADY_EXISTS",
            "Email is already in use",
          );
        case "ROOM_NOT_AVAILABLE":
          throw AppError.conflict(
            "ROOM_NOT_AVAILABLE",
            "Room is not available",
          );
        case "ROOM_NOT_FOUND":
          throw AppError.notFound("ROOM_NOT_FOUND");
        case "OWNER_PROFILE_NOT_FOUND":
          throw AppError.forbidden("OWNER_PROFILE_NOT_FOUND", "Forbidden");
        case "DORM_NOT_OWNED":
          throw AppError.forbidden(
            "DORM_NOT_OWNED",
            "You are not the owner of this dorm",
          );
        default:
          throw error;
      }
    }
  },

  getTenantById: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { tenantId } = request.params as {
      tenantId: string;
    };

    if (!tenantId) {
      throw AppError.badRequest("TENANT_ID_REQUIRED");
    }

    try {
      const result = await tenantService.getTenantById(user.sub, tenantId);
      return reply.status(200).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden("FORBIDDEN");
        case "TENANT_NOT_FOUND":
          throw AppError.notFound("TENANT_NOT_FOUND");
        default:
          throw error;
      }
    }
  },

  updateTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { tenantId } = request.params as {
      tenantId: string;
    };

    if (!tenantId) {
      throw AppError.badRequest("TENANT_ID_REQUIRED");
    }

    const body = updateTenantSchema.parse(request.body);

    try {
      const result = await tenantService.updateTenant(user.sub, tenantId, body);
      return reply.status(200).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden("FORBIDDEN", "Permission denied.");
        case "TENANT_NOT_FOUND":
          throw AppError.notFound("TENANT_NOT_FOUND", "Tenant not found.");
        case "TENANT_ALREADY_MOVED_OUT":
          throw AppError.badRequest(
            "TENANT_ALREADY_MOVED_OUT",
            "Cannot update tenant who has already moved out.",
          );
        case "EMAIL_ALREADY_EXISTS":
          throw AppError.conflict("EMAIL_ALREADY_EXISTS", "Email taken.");
        default:
          throw error;
      }
    }
  },

  moveOut: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { tenantId } = request.params as {
      tenantId: string;
    };

    const { moveOutDate } = moveOutSchema.parse(request.body ?? {});

    if (!tenantId) {
      throw AppError.badRequest("TENANT_ID_REQUIRED");
    }

    try {
      const result = await tenantService.moveOut(
        user.sub,
        tenantId,
        moveOutDate,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden(
            "FORBIDDEN",
            "You don't have permission to perform this action.",
          );
        case "TENANT_NOT_FOUND":
          throw AppError.notFound("TENANT_NOT_FOUND", "Tenant not found.");
        case "ALREADY_MOVED_OUT":
          throw AppError.badRequest(
            "ALREADY_MOVED_OUT",
            "This tenant has already moved out.",
          );
        case "OUTSTANDING_BILLS_EXIST":
          throw AppError.badRequest(
            "OUTSTANDING_BILLS_EXIST",
            "Tenant has unpaid bills or bills waiting for verification. Please clear them before moving out.",
          );
        default:
          throw error;
      }
    }
  },

  cancelMoveOut: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { tenantId } = request.params as {
      tenantId: string;
    };

    if (!tenantId) {
      throw AppError.badRequest("TENANT_ID_REQUIRED");
    }

    try {
      const result = await tenantService.cancelMoveOut(user.sub, tenantId);
      return reply.status(200).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden(
            "FORBIDDEN",
            "You don't have permission to perform this action.",
          );
        case "TENANT_NOT_FOUND":
          throw AppError.notFound("TENANT_NOT_FOUND", "Tenant not found.");
        case "NOT_SCHEDULED_FOR_MOVE_OUT":
          throw AppError.badRequest(
            "NOT_SCHEDULED",
            "This tenant does not have a scheduled move-out date.",
          );
        case "ALREADY_MOVED_OUT":
          throw AppError.badRequest(
            "ALREADY_MOVED_OUT",
            "Cannot cancel. This tenant has already moved out.",
          );
        default:
          throw error;
      }
    }
  },

  getDashboard: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const data = await tenantService.getDashboardStats(user.sub);
    return reply.send(data);
  },

  getMyBills: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { page, limit, year, status, month } = getMyBillsQuerySchema.parse(
      request.query,
    );

    const result = await tenantService.getBills({
      userId: user.sub,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      year: year,
      status: status,
      month: month,
    });

    return reply.send(result);
  },

  getBillById: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    try {
      const bill = await tenantService.getBillById(user.sub, billId);
      return reply.send(bill);
    } catch (error: any) {
      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound(
          "BILL_NOT_FOUND",
          "ไม่พบข้อมูลบิล หรือบิลนี้อาจถูกลบออกไปแล้ว",
        );
      }

      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden(
          "FORBIDDEN_ACCESS",
          "คุณไม่มีสิทธิ์เข้าถึงข้อมูลบิลใบนี้",
        );
      }

      throw error;
    }
  },

  printBillTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    try {
      const pdfBuffer = await tenantService.generateBillPdf(user.sub, billId);
      return reply
        .type("application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename=bill-${billId}.pdf`,
        )
        .send(pdfBuffer);
    } catch (error: any) {
      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND", "ไม่สามารถสร้างไฟล์ PDF ได้");
      }

      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden(
          "FORBIDDEN_ACCESS",
          "ไม่สามารถสร้างไฟล์ PDF ได้",
        );
      }

      throw error;
    }
  },

  generateQrPayment: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const body = generateQrPaymentSchema.parse(request.body);

    try {
      const result = await tenantService.generatePromptPayQR(
        user.sub,
        body.billId,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      switch (error.message) {
        case "BILL_NOT_FOUND":
          throw AppError.notFound("BILL_NOT_FOUND", "ไม่พบข้อมูลบิล");
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden(
            "FORBIDDEN_ACCESS",
            "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
          );
        case "PROMPTPAY_NOT_CONFIGURED":
          throw AppError.badRequest(
            "PROMPTPAY_NOT_CONFIGURED",
            "หอพักนี้ยังไม่ได้ตั้งค่าการชำระเงินผ่าน PromptPay",
          );
        default:
          throw error;
      }
    }
  },

  uploadSlip: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const parts = await request.file();

    if (!parts) {
      throw AppError.badRequest("FILE_REQUIRED", "กรุณาอัพโหลดรูปภาพสลิป");
    }

    const fields: any = parts.fields;
    const billId = fields.billId?.value;
    const refNo = fields.refNo?.value;

    if (!billId) {
      throw AppError.badRequest("BILL_ID_REQUIRED");
    }

    const fileBuffer = await parts.toBuffer();

    try {
      const result = await tenantService.processPaymentSlip({
        userId: user.sub,
        billId,
        refNo: refNo || null,
        fileBuffer,
        mimeType: parts.mimetype,
        fileName: parts.filename,
      });

      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error("Upload Error Details:");
      logger.error(error);

      switch (error.message) {
        case "SLIP_DUPLICATE":
        case "SLIP_DUPLICATE_REF":
        case "SLIP_DUPLICATE_DETECTED_FROM_IMAGE":
          throw AppError.badRequest(error.message);
        case "BILL_NOT_FOUND":
          throw AppError.notFound("BILL_NOT_FOUND");
        case "FORBIDDEN_ACCESS":
          throw AppError.forbidden("FORBIDDEN_ACCESS");
        case "INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED":
          throw AppError.badRequest("INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED");
        case "INVALID_SLIP_API":
        case "SLIP_AMOUNT_MISMATCH":
        case "INVALID_SLIP":
          throw AppError.badRequest("INVALID_SLIP");
        default:
          throw error;
      }
    }
  },

  createMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    if (!user || !user.sub) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    const parts = request.parts();
    let title = "";
    let description = "";
    const files: any[] = [];

    for await (const part of parts) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();

        files.push({
          filename: part.filename,
          mimetype: part.mimetype,
          file: buffer,
        });
      } else {
        if (part.fieldname === "title") title = (part.value as string).trim();

        if (part.fieldname === "description")
          description = (part.value as string).trim();
      }
    }

    if (!title) {
      throw AppError.badRequest("TITLE_REQUIRED", "Title is required");
    }

    if (files.length > 2) {
      throw AppError.badRequest("MAX_IMAGES_EXCEEDED", "Max 2 images allowed");
    }

    try {
      const result = await tenantService.createMaintenance({
        userId: user.sub,
        title,
        description,
        files,
      });

      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.message === "TENANT_OR_ROOM_NOT_FOUND") {
        throw AppError.notFound("TENANT_OR_ROOM_NOT_FOUND");
      }

      throw error;
    }
  },

  getMyHistoryMaintenances: async (
    request: FastifyRequest<{
      Querystring: GetMaintenanceQuery;
    }>,
    reply: FastifyReply,
  ) => {
    const user = request.user as UserDecodedDto;

    if (!user || !user.sub) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    const { page, limit, status, search } = request.query;

    const result = await tenantService.getMyMaintenances(user.sub, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      search,
    });

    return reply.status(200).send(result);
  },

  updateMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { requestId } = request.params as {
      requestId: string;
    };

    const body = (request.body as any) || {};
    const deletedIdsRaw = body.deletedImageIds || body["deletedImageIds[]"];
    let deletedImageIds: string[] | undefined;

    if (deletedIdsRaw) {
      if (Array.isArray(deletedIdsRaw)) {
        deletedImageIds = deletedIdsRaw.map((item: any) =>
          item.value !== undefined ? String(item.value) : String(item),
        );
      } else {
        const val =
          deletedIdsRaw.value !== undefined
            ? String(deletedIdsRaw.value)
            : String(deletedIdsRaw);
        deletedImageIds = [val];
      }
    }

    const imagesRaw = body.images || body["images[]"];
    let images: any[] | undefined;

    if (imagesRaw) {
      images = Array.isArray(imagesRaw) ? imagesRaw : [imagesRaw];
    }

    const updateData = {
      title: getMultipartValue(body.title),
      description: getMultipartValue(body.description),
      images: images,
      deletedImageIds: deletedImageIds,
    };

    try {
      const result = await tenantService.updateMaintenance(
        user.sub,
        requestId,
        updateData,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "Maintenance request not found or not authorized") {
        throw AppError.notFound("MAINTENANCE_NOT_FOUND", error.message);
      }

      if (error.message === "Cannot edit request that is not OPEN") {
        throw AppError.badRequest("MAINTENANCE_NOT_OPEN", error.message);
      }

      throw error;
    }
  },

  cancelMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { requestId } = request.params as {
      requestId: string;
    };

    try {
      const result = await tenantService.cancelMaintenance(user.sub, requestId);
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "Maintenance request not found or not authorized") {
        throw AppError.notFound(
          "MAINTENANCE_NOT_FOUND",
          "ไม่พบรายการแจ้งซ่อม หรือคุณไม่มีสิทธิ์ลบรายการนี้",
        );
      }

      if (error.message === "Cannot cancel request that is not OPEN") {
        throw AppError.badRequest(
          "MAINTENANCE_NOT_OPEN",
          "ไม่สามารถยกเลิกได้ เนื่องจากเจ้าหน้าที่รับเรื่องไปแล้ว",
        );
      }

      throw error;
    }
  },

  getContractDetail: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    if (!user || !user.sub) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    try {
      const result = await tenantService.getTenantContractDetail(user.sub);
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "TENANT_NOT_FOUND") {
        throw AppError.notFound("TENANT_NOT_FOUND", "tenant not found");
      }

      throw error;
    }
  },

  reEntryTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const body = reEntryTenantSchema.parse(request.body);

    try {
      const result = await tenantService.createNewContractForExistingUser(
        user.sub,
        body,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);
      throw AppError.badRequest("RE_ENTRY_FAILED", error.message);
    }
  },
};
