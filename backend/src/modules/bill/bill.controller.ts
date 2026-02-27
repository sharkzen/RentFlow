import { FastifyRequest, FastifyReply } from "fastify";
import { billService } from "./bill.service";
import logger from "@/utils/logger";
import { UserDecodedDto } from "../auth/dto/user.dto";
import sharp from "sharp";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";

export const BillController = {
  getBills: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;
      const query = request.query as any;

      const { dormId } = request.params as {
        dormId: string;
      };

      if (!dormId) {
        return reply.status(400).send({
          message: "DORM_ID_REQUIRED",
        });
      }

      const result = await billService.getBills({
        dormId,
        sub: user.sub,
        ...query,
      });

      return reply.send(result);
    } catch (error: any) {
      logger.error(error);

      return reply.status(500).send({
        message: error.message,
      });
    }
  },

  createBills: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;
      const body = request.body as any;

      if (!body.dormId) {
        return reply.status(400).send({
          message: "Dormitory ID is required",
        });
      }

      const result = await billService.createBills(body.dormId, body, user);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error);

      if (error.message === "DORM_SETTINGS_NOT_FOUND") {
        return reply.status(400).send({
          message: "DORM_SETTINGS_NOT_FOUND",
        });
      }

      if (error.message === "PAYMENT_METHOD_REQUIRED") {
        return reply.status(400).send({
          message: "PAYMENT_METHOD_REQUIRED",
        });
      }

      if (error.message.startsWith("DUPLICATE_BILL_FOUND")) {
        const roomNum = error.message.split(":")[1];

        return reply.status(409).send({
          message: "DUPLICATE_BILL_FOUND",
          roomNumber: roomNum,
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  deleteBill: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId } = request.params as {
        billId: string;
      };

      const result = await billService.deleteBill(user.sub, billId);
      return reply.status(200).send(result);
    } catch (error: any) {
      logger.error("DELETE BILL ERROR:", error);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          code: "FORBIDDEN",
          message: "คุณไม่มีสิทธิ์ลบบิลนี้",
        });
      }

      if (error.message === "BILL_NOT_FOUND") {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "ไม่พบข้อมูลบิลที่ต้องการลบ",
        });
      }

      return reply.status(500).send({
        code: "INTERNAL_SERVER_ERROR",
        message: "เกิดข้อผิดพลาดในการลบบิล โปรดลองใหม่อีกครั้ง",
      });
    }
  },

  updateStatus: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId } = request.params as {
        billId: string;
      };

      const { status } = request.body as {
        status: string;
      };

      const result = await billService.updateStatus(
        user.sub,
        billId,
        status as any,
      );
      return reply.send(result);
    } catch (error: any) {
      logger.error("UPDATE STATUS ERROR:", error);

      return reply.status(500).send({
        message: error.message || "UPDATE_STATUS_FAILED",
      });
    }
  },

  addBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId } = request.params as {
        billId: string;
      };

      const body = request.body as {
        name: string;
        amount: number;
        type: "CHARGE" | "DISCOUNT";
      };

      if (!body.name || !body.amount || !body.type) {
        return reply.status(400).send({
          message: "INVALID_DATA",
        });
      }

      const result = await billService.addBillItem(user.sub, billId, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error("ADD BILL ITEM ERROR:", error);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "FORBIDDEN_ACCESS",
        });
      }

      return reply.status(500).send({
        message: error.message || "ADD_ITEM_FAILED",
      });
    }
  },

  deleteBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId, itemId } = request.params as {
        billId: string;
        itemId: string;
      };

      const result = await billService.deleteBillItem(user.sub, billId, itemId);
      return reply.send(result);
    } catch (error: any) {
      logger.error("DELETE BILL ITEM ERROR:", error);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "FORBIDDEN_ACCESS",
        });
      }

      return reply.status(500).send({
        message: error.message || "DELETE_ITEM_FAILED",
      });
    }
  },

  updateBillItem: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId, itemId } = request.params as {
        billId: string;
        itemId: string;
      };

      const body = request.body as {
        name?: string;
        amount?: number;
        type?: "CHARGE" | "DISCOUNT";
      };

      const result = await billService.updateBillItem(
        user.sub,
        billId,
        itemId,
        body,
      );
      return reply.send(result);
    } catch (error: any) {
      logger.error("UPDATE BILL ITEM ERROR:", error);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "FORBIDDEN_ACCESS",
        });
      }

      return reply.status(500).send({
        message: error.message || "UPDATE_ITEM_FAILED",
      });
    }
  },

  uploadSlip: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
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
            return reply.status(413).send({
              message: "FILE_TOO_LARGE",
            });
          }
        }
      }

      if (filesToProcess.length === 0) {
        return reply.status(400).send({
          message: "NO_FILE_UPLOADED",
        });
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
      logger.error("UPLOAD SLIP ERROR:", error);

      return reply.status(500).send({
        message: error.message || "UPLOAD_FAILED",
      });
    }
  },

  applyAdvancePayment: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.user as UserDecodedDto;

      const { billId } = request.params as {
        billId: string;
      };

      const result = await billService.applyAdvancePayment(user.sub, billId);
      return reply.send(result);
    } catch (error: any) {
      logger.error("APPLY ADVANCE PAYMENT ERROR:", error);

      if (error.message === "FORBIDDEN_ACCESS") {
        return reply.status(403).send({
          message: "FORBIDDEN_ACCESS",
        });
      }

      if (error.message === "NO_ADVANCE_PAYMENT") {
        return reply.status(400).send({
          message: "ผู้เช่าไม่มีเงินล่วงหน้าคงเหลือ",
        });
      }

      if (error.message === "ALREADY_APPLIED") {
        return reply.status(400).send({
          message: "มีการหักเงินล่วงหน้าไปแล้ว",
        });
      }

      return reply.status(500).send({
        message: error.message || "APPLY_ADVANCE_PAYMENT_FAILED",
      });
    }
  },
};
