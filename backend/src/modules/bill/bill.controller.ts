import { FastifyRequest, FastifyReply } from "fastify";
import { billService } from "./bill.service";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";
import sharp from "sharp";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import {
  getBillsQuerySchema,
  createBillsSchema,
  updateStatusSchema,
  addBillItemSchema,
  updateBillItemSchema,
  rejectBillSchema,
  sendBillEmailsSchema,
  generatePdfSchema,
  scanMeterSchema,
  saveDraftSchema,
} from "./dto/bill.schema";

export const BillController = {
  getBills: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const query = getBillsQuerySchema.parse(request.query);

    const { dormId } = request.params as {
      dormId: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
    }

    const result = await billService.getBills({
      dormId,
      sub: user.sub,
      ...query,
    });

    return reply.send(result);
  },

  createBills: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const body = createBillsSchema.parse(request.body);

    if (!body.dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED", "Dormitory ID is required");
    }

    try {
      const result = await billService.createBills(body.dormId, body, user);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "DORM_SETTINGS_NOT_FOUND") {
        throw AppError.badRequest("DORM_SETTINGS_NOT_FOUND");
      }

      if (error.message === "PAYMENT_METHOD_REQUIRED") {
        throw AppError.badRequest("PAYMENT_METHOD_REQUIRED");
      }

      if (error.message?.startsWith("DUPLICATE_BILL_FOUND")) {
        const roomNum = error.message.split(":")[1];

        throw new AppError(409, "DUPLICATE_BILL_FOUND", roomNum);
      }

      throw error;
    }
  },

  deleteBill: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    try {
      const result = await billService.deleteBill(user.sub, billId);
      return reply.status(200).send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN", "คุณไม่มีสิทธิ์ลบบิลนี้");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("NOT_FOUND", "ไม่พบข้อมูลบิลที่ต้องการลบ");
      }

      throw error;
    }
  },

  updateStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    const { status } = updateStatusSchema.parse(request.body);

    const result = await billService.updateStatus(user.sub, billId, status);
    return reply.send(result);
  },

  addBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    const body = addBillItemSchema.parse(request.body);

    try {
      const result = await billService.addBillItem(user.sub, billId, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN_ACCESS");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND");
      }

      throw error;
    }
  },

  deleteBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId, itemId } = request.params as {
      billId: string;
      itemId: string;
    };

    try {
      const result = await billService.deleteBillItem(user.sub, billId, itemId);
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN_ACCESS");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND");
      }

      if (error.message === "ITEM_NOT_FOUND") {
        throw AppError.notFound("ITEM_NOT_FOUND");
      }

      throw error;
    }
  },

  updateBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId, itemId } = request.params as {
      billId: string;
      itemId: string;
    };

    const body = updateBillItemSchema.parse(request.body);

    try {
      const result = await billService.updateBillItem(
        user.sub,
        billId,
        itemId,
        body,
      );
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN_ACCESS");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND");
      }

      if (error.message === "ITEM_NOT_FOUND") {
        throw AppError.notFound("ITEM_NOT_FOUND");
      }

      throw error;
    }
  },

  // NOTE: multipart file upload endpoint — no zod body schema (files() stream, not JSON body).
  uploadSlip: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    const parts = request.files({
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    });

    const filesToProcess: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    }[] = [];

    for await (const part of parts) {
      if (!part.file) continue;

      try {
        const buffer = await part.toBuffer();

        filesToProcess.push({
          buffer,
          filename: part.filename,
          mimetype: part.mimetype,
        });
      } catch (error: any) {
        if (error.code === "FST_REQ_FILE_TOO_LARGE") {
          throw AppError.badRequest("FILE_TOO_LARGE");
        }
      }
    }

    if (filesToProcess.length === 0) {
      throw AppError.badRequest("NO_FILE_UPLOADED");
    }

    const fileData = filesToProcess[0];
    let optimizedBuffer = fileData.buffer;

    try {
      if (["image/jpeg", "image/jpg"].includes(fileData.mimetype)) {
        optimizedBuffer = await sharp(fileData.buffer)
          .jpeg({
            quality: 80,
          })
          .toBuffer();
      } else if (fileData.mimetype === "image/png") {
        optimizedBuffer = await sharp(fileData.buffer)
          .png({
            compressionLevel: 9,
          })
          .toBuffer();
      }
    } catch (e) {
      logger.error("Optimization failed");
    }

    const extension = extname(fileData.filename);
    const objectKey = `slips/${billId}/${randomUUID()}${extension}`;

    try {
      const result = await billService.uploadSlip({
        billId,
        userSub: user.sub,
        file: optimizedBuffer,
        objectKey,
        mimeType: fileData.mimetype,
        size: optimizedBuffer.length,
      });

      return reply.send(result);
    } catch (error: any) {
      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND");
      }

      throw error;
    }
  },

  applyAdvancePayment: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    try {
      const result = await billService.applyAdvancePayment(user.sub, billId);
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN_ACCESS");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND");
      }

      if (error.message === "NO_ADVANCE_PAYMENT") {
        throw AppError.badRequest(
          "NO_ADVANCE_PAYMENT",
          "ผู้เช่าไม่มีเงินล่วงหน้าคงเหลือ",
        );
      }

      if (error.message === "ALREADY_APPLIED") {
        throw AppError.badRequest("ALREADY_APPLIED", "มีการหักเงินล่วงหน้าไปแล้ว");
      }

      if (error.message === "BILL_NOT_PENDING") {
        throw AppError.badRequest(
          "BILL_NOT_PENDING",
          "ไม่สามารถหักเงินได้ เนื่องจากบิลนี้ไม่ได้อยู่ในสถานะรอชำระ",
        );
      }

      throw error;
    }
  },

  rejectBill: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billId } = request.params as {
      billId: string;
    };

    const body = rejectBillSchema.parse(request.body ?? {});

    try {
      const result = await billService.rejectBill(
        user.sub,
        billId,
        body.reason,
      );
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN_ACCESS") {
        throw AppError.forbidden("FORBIDDEN_ACCESS");
      }

      if (error.message === "BILL_NOT_FOUND") {
        throw AppError.notFound("BILL_NOT_FOUND", "ไม่พบบิลที่ต้องการ");
      }

      if (error.message === "NO_PAYMENT_FOUND") {
        throw AppError.badRequest(
          "NO_PAYMENT_FOUND",
          "บิลนี้ยังไม่มีการแจ้งชำระเงิน",
        );
      }

      throw error;
    }
  },

  getDrafts: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { dormId } = request.params as {
      dormId: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
    }

    const result = await billService.getDrafts({
      dormId,
      sub: user.sub,
    });

    return reply.send(result);
  },

  saveDraft: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const body = saveDraftSchema.parse(request.body);
    const ipAddress = request.ip;

    const result = await billService.saveDraft({
      ...body,
      sub: user.sub,
      ipAddress,
    });

    return reply.status(201).send(result);
  },

  deleteDraft: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { draftId } = request.params as {
      draftId: string;
    };

    const ipAddress = request.ip;

    if (!draftId) {
      throw AppError.badRequest("DRAFT_ID_REQUIRED");
    }

    try {
      await billService.deleteDraft({
        draftId,
        sub: user.sub,
        ipAddress,
      });

      return reply.send({
        success: true,
      });
    } catch (error: any) {
      if (error.message === "DRAFT_NOT_FOUND") {
        throw AppError.notFound("DRAFT_NOT_FOUND");
      }

      throw error;
    }
  },

  // NOTE: multipart file upload endpoint — no zod body schema.
  uploadTempImage: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;
    const data = await request.file();

    if (!data) {
      throw AppError.badRequest("FILE_REQUIRED");
    }

    const buffer = await data.toBuffer();
    const mimetype = data.mimetype;
    const filename = data.filename;

    const result = await billService.uploadTempImage({
      sub: user.sub,
      buffer,
      mimetype,
      filename,
    });

    return reply.send(result);
  },

  deleteTempImage: async (request: FastifyRequest, reply: FastifyReply) => {
    const { objectKey } = request.query as {
      objectKey: string;
    };

    if (!objectKey) {
      throw AppError.badRequest("OBJECT_KEY_REQUIRED");
    }

    await billService.deleteTempImage(objectKey);

    return reply.send({
      success: true,
    });
  },

  sendBillEmails: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billIds } = sendBillEmailsSchema.parse(request.body);

    const result = await billService.sendBillEmails({
      sub: user.sub,
      billIds,
    });

    return reply.send(result);
  },

  scanMeter: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    if (!user) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    const { imageBase64, scanType, roomId } = scanMeterSchema.parse(
      request.body,
    );

    try {
      const result = await billService.scanMeter(
        imageBase64,
        scanType,
        roomId,
        user,
      );

      if (!result.success) {
        return reply.status(400).send(result);
      }

      return reply.send(result);
    } catch (error: any) {
      logger.error(`[Controller - scanMeter] ${error.message}`);

      if (error.message === "OWNER_PROFILE_NOT_FOUND") {
        throw AppError.forbidden("OWNER_PROFILE_NOT_FOUND");
      }

      if (error.message === "ROOM_NOT_FOUND_OR_UNAUTHORIZED") {
        throw AppError.notFound("ROOM_NOT_FOUND_OR_UNAUTHORIZED");
      }

      throw error;
    }
  },

  generatePdf: async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as UserDecodedDto;

    const { billIds } = generatePdfSchema.parse(request.body);

    try {
      const { pdfBuffer, filename } = await billService.generateBulkBillPdf(
        user.sub,
        billIds,
      );

      const encodedFilename = encodeURIComponent(filename);

      return reply
        .type("application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        )
        .send(pdfBuffer);
    } catch (error: any) {
      if (error.message === "ไม่พบข้อมูลบิล หรือคุณไม่มีสิทธิ์เข้าถึง") {
        throw AppError.notFound(
          "BILLS_NOT_FOUND",
          "ไม่พบข้อมูลบิล หรือคุณไม่มีสิทธิ์เข้าถึง",
        );
      }

      throw error;
    }
  },
};
