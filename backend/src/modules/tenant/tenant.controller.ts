import logger from "@/utils/logger";
import { FastifyRequest, FastifyReply } from "fastify";
import { tenantService } from "@/modules/tenant/tenant.service";
import { UserDecodedDto } from "../auth/dto/user.dto";

interface GetTenantDormQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

interface GetMyBillsQuery {
  page?: string;
  limit?: string;
  month?: string;
  year?: string;
  status?: string;
}

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

      const { page, limit, search, status } =
        request.query as GetTenantDormQuery;

      const result = await tenantService.getTenantDorm({
        dormId,
        sub,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search?.trim() || undefined,
        status: status || "active",
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
      const body = request.body as any;

      if (!body.email || !body.roomId || !body.firstName) {
        return reply.status(400).send({
          message: "MISSING_REQUIRED_FIELDS",
        });
      }

      const result = await tenantService.createTenant(user.sub, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

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

  getTenantById: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const { tenantId } = request.params as {
        tenantId: string;
      };

      if (!tenantId) {
        return reply.status(400).send({
          message: "TENANT_ID_REQUIRED",
        });
      }

      const result = await tenantService.getTenantById(user.sub, tenantId);
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            message: "FORBIDDEN",
          });
        case "TENANT_NOT_FOUND":
          return reply.status(404).send({
            message: "TENANT_NOT_FOUND",
          });
        default:
          return reply.status(500).send({
            message: "INTERNAL_SERVER_ERROR",
          });
      }
    }
  },

  updateTenant: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const { tenantId } = request.params as {
        tenantId: string;
      };

      const body = request.body as any;

      if (!tenantId)
        return reply.status(400).send({
          message: "TENANT_ID_REQUIRED",
        });

      const result = await tenantService.updateTenant(user.sub, tenantId, body);
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            code: "FORBIDDEN",
            message: "Permission denied.",
          });
        case "TENANT_NOT_FOUND":
          return reply.status(404).send({
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found.",
          });
        case "TENANT_ALREADY_MOVED_OUT":
          return reply.status(400).send({
            code: "TENANT_ALREADY_MOVED_OUT",
            message: "Cannot update tenant who has already moved out.",
          });
        case "EMAIL_ALREADY_EXISTS":
          return reply.status(409).send({
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email taken.",
          });
        default:
          return reply.status(500).send({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong.",
          });
      }
    }
  },

  moveOut: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const { tenantId } = request.params as {
        tenantId: string;
      };

      const { moveOutDate } =
        (request.body as {
          moveOutDate?: string;
        }) || {};

      if (!tenantId) {
        return reply.status(400).send({
          message: "TENANT_ID_REQUIRED",
        });
      }

      const result = await tenantService.moveOut(
        user.sub,
        tenantId,
        moveOutDate,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            code: "FORBIDDEN",
            message: "You don't have permission to perform this action.",
          });
        case "TENANT_NOT_FOUND":
          return reply.status(404).send({
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found.",
          });
        case "ALREADY_MOVED_OUT":
          return reply.status(400).send({
            code: "ALREADY_MOVED_OUT",
            message: "This tenant has already moved out.",
          });
        case "OUTSTANDING_BILLS_EXIST":
          return reply.status(400).send({
            code: "OUTSTANDING_BILLS_EXIST",
            message:
              "Tenant has unpaid bills or bills waiting for verification. Please clear them before moving out.",
          });
        default:
          return reply.status(500).send({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong.",
          });
      }
    }
  },

  cancelMoveOut: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const { tenantId } = request.params as {
        tenantId: string;
      };

      if (!tenantId) {
        return reply.status(400).send({
          message: "TENANT_ID_REQUIRED",
        });
      }

      const result = await tenantService.cancelMoveOut(user.sub, tenantId);
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      switch (error.message) {
        case "OWNER_PROFILE_NOT_FOUND":
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            code: "FORBIDDEN",
            message: "You don't have permission to perform this action.",
          });
        case "TENANT_NOT_FOUND":
          return reply.status(404).send({
            code: "TENANT_NOT_FOUND",
            message: "Tenant not found.",
          });
        case "NOT_SCHEDULED_FOR_MOVE_OUT":
          return reply.status(400).send({
            code: "NOT_SCHEDULED",
            message: "This tenant does not have a scheduled move-out date.",
          });
        case "ALREADY_MOVED_OUT":
          return reply.status(400).send({
            code: "ALREADY_MOVED_OUT",
            message: "Cannot cancel. This tenant has already moved out.",
          });
        default:
          return reply.status(500).send({
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong.",
          });
      }
    }
  },

  getDashboard: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const data = await tenantService.getDashboardStats(user.sub);
      return reply.send(data);
    } catch (error: any) {
      request.log.error(error);

      return reply.status(500).send({
        message: "Failed to fetch tenant dashboard",
      });
    }
  },

  getMyBills: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { page, limit, year, status, month } =
      request.query as GetMyBillsQuery;

    try {
      const result = await tenantService.getBills({
        userId: user.sub,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        year: year,
        status: status,
        month: month,
      });

      return reply.send(result);
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        message: "Failed to fetch bills",
      });
    }
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
      request.log.error(error);

      if (error.message === "BILL_NOT_FOUND") {
        return reply.status(404).send({
          message: "BILL_NOT_FOUND",
          error: "ไม่พบข้อมูลบิล หรือบิลนี้อาจถูกลบออกไปแล้ว",
        });
      }

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "FORBIDDEN_ACCESS",
          error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลบิลใบนี้",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
        error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง",
      });
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
      request.log.error(error);

      return reply.status(500).send({
        message: "ไม่สามารถสร้างไฟล์ PDF ได้",
      });
    }
  },

  generateQrPayment: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const body = request.body as {
      billId: string;
    };

    try {
      if (!body.billId) {
        return reply.status(400).send({
          message: "BILL_ID_REQUIRED",
        });
      }

      const result = await tenantService.generatePromptPayQR(
        user.sub,
        body.billId,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error(error);

      switch (error.message) {
        case "BILL_NOT_FOUND":
          return reply.status(404).send({
            message: "ไม่พบข้อมูลบิล",
          });
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
          });
        case "PROMPTPAY_NOT_CONFIGURED":
          return reply.status(400).send({
            message: "หอพักนี้ยังไม่ได้ตั้งค่าการชำระเงินผ่าน PromptPay",
          });
        default:
          return reply.status(500).send({
            message: "INTERNAL_SERVER_ERROR",
          });
      }
    }
  },

  uploadSlip: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    try {
      const parts = await request.file();

      if (!parts) {
        return reply.status(400).send({
          message: "กรุณาอัพโหลดรูปภาพสลิป",
        });
      }

      const fields: any = parts.fields;
      const billId = fields.billId?.value;
      const refNo = fields.refNo?.value;

      if (!billId) {
        return reply.status(400).send({
          message: "BILL_ID_REQUIRED",
        });
      }

      const fileBuffer = await parts.toBuffer();

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
          return reply.status(400).send({
            message: error.message,
          });
        case "BILL_NOT_FOUND":
          return reply.status(404).send({
            message: "BILL_NOT_FOUND",
          });
        case "FORBIDDEN_ACCESS":
          return reply.status(403).send({
            message: "FORBIDDEN_ACCESS",
          });
        case "INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED":
          return reply.status(400).send({
            message: "INVALID_FILE_TYPE_ONLY_IMAGES_ALLOWED",
          });
        case "INVALID_SLIP_API":
        case "SLIP_AMOUNT_MISMATCH":
        case "INVALID_SLIP":
          return reply.status(400).send({
            code: "INVALID_SLIP",
            message: "INVALID_SLIP",
          });
        default:
          return reply.status(500).send({
            message: "INTERNAL_SERVER_ERROR",
          });
      }
    }
  },

  createMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      if (!user || !user.sub) {
        return reply.status(401).send({
          message: "Unauthorized",
        });
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
        return reply.status(400).send({
          message: "Title is required",
        });
      }

      if (files.length > 2) {
        return reply.status(400).send({
          message: "Max 2 images allowed",
        });
      }

      const result = await tenantService.createMaintenance({
        userId: user.sub,
        title,
        description,
        files,
      });

      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: error.message || "Internal Server Error",
      });
    }
  },

  getMyHistoryMaintenances: async (
    request: FastifyRequest<{
      Querystring: GetMaintenanceQuery;
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = request.user as UserDecodedDto;

      if (!user || !user.sub) {
        return reply.status(401).send({
          message: "Unauthorized",
        });
      }

      const { page, limit, status, search } = request.query;

      const result = await tenantService.getMyMaintenances(user.sub, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        status,
        search,
      });

      return reply.status(200).send(result);
    } catch (error) {
      logger.error(error);

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  updateMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { requestId } = request.params as {
        requestId: string;
      };

      const body = (request.body as any) || {};
      console.log("Raw Body:", body);
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

      const result = await tenantService.updateMaintenance(
        user.sub,
        requestId,
        updateData,
      );
      return reply.status(200).send(result);
    } catch (error: any) {
      console.error("Update Error:", error);

      if (error.message === "Maintenance request not found or not authorized") {
        return reply.status(404).send({
          message: error.message,
        });
      }

      if (error.message === "Cannot edit request that is not OPEN") {
        return reply.status(400).send({
          message: error.message,
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  cancelMaintenance: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { requestId } = request.params as {
        requestId: string;
      };

      const result = await tenantService.cancelMaintenance(user.sub, requestId);
      return reply.status(200).send(result);
    } catch (error: any) {
      console.error(error);

      if (error.message === "Maintenance request not found or not authorized") {
        return reply.status(404).send({
          message: error.message,
        });
      }

      if (error.message === "Cannot cancel request that is not OPEN") {
        return reply.status(400).send({
          message: error.message,
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
      });
    }
  },

  getContractDetail: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      if (!user || !user.sub) {
        return reply.status(401).send({
          message: "Unauthorized",
        });
      }

      const result = await tenantService.getTenantContractDetail(user.sub);
      return reply.status(200).send(result);
    } catch (error: any) {
      request.log.error(error);

      if (error.message === "TENANT_NOT_FOUND") {
        return reply.status(404).send({
          message: "tenant not found",
        });
      }

      return reply.status(500).send({
        message: "Internal Server Error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};
