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

      if (!dormId)
        return reply.status(400).send({
          message: "DORM_ID_REQUIRED",
        });

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

      const result = await billService.createBills(body.dormId, body);
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply.status(500).send({
        message: error.message,
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
};
