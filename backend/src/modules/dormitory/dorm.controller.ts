import { FastifyRequest, FastifyReply } from "fastify";
import { extname } from "path";
import { randomUUID } from "crypto";
import { dormService } from "@/modules/dormitory/dorm.service";
import sharp from "sharp";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import {
  DormFormDataDto,
  GetDormsQueryDto,
} from "@/modules/dormitory/dtos/dorm.dto";
import logger from "@/utils/logger";

export const DormController = {
  async getAllDorms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as GetDormsQueryDto;
      const dorms = await dormService.getAllDorms(query);
      return reply.send(dorms);
    } catch (error: any) {
      logger.error(error.message);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async getDormSlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as {
      slug: string;
    };

    if (!slug) {
      return reply.status(400).send({
        message: "SLUG_REQUIRED",
      });
    }

    try {
      const decodedSlug = decodeURIComponent(slug);
      const dorm = await dormService.getDormSlug(decodedSlug);

      if (!dorm) {
        return reply.status(404).send({
          message: "DORM_NOT_FOUND",
        });
      }

      return reply.send(dorm);
    } catch (error: any) {
      console.error(error);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async createDorm(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const name = request.body as string;

    if (!name)
      return reply.status(400).send({
        message: "NAME_REQUIRED",
      });

    try {
      const dorm = await dormService.createDorm(name, user.sub);
      logger.info(dorm);
      return reply.status(201).send(dorm);
    } catch (error: any) {
      logger.error(error.message);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async getDorms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    try {
      const dorms = await dormService.getDorms(user);
      reply.send(dorms);
    } catch (error: any) {
      logger.error(error.message);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async updateDorms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const dorm = request.body as DormFormDataDto;

    try {
      const updated = await dormService.updateDorm(dorm, user.sub);
      return reply.send(updated);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "FORBIDDEN") {
        return reply.status(403).send({
          message: "FORBIDDEN",
        });
      }

      return reply.status(500).send({
        message: "UPDATE_FAILED",
      });
    }
  },

  async getDormImages(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { dormId } = request.params as {
      dormId: string;
    };

    try {
      const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

      if (!ownerDorm)
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      const images = await dormService.getDormImages(dormId);
      reply.send(images);
    } catch (error: any) {
      reply.status(500).send({
        message: "FAILED_TO_FETCH_IMAGES",
      });
    }
  },

  async updateDormStatus(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { dormId } = request.params as {
      dormId?: string;
    };

    const { isPublished } = request.body as {
      isPublished?: boolean;
    };

    if (!dormId) {
      return reply.status(400).send({
        message: "DORM_ID_REQUIRED",
      });
    }

    if (typeof isPublished !== "boolean") {
      return reply.status(400).send({
        message: "INVALID_PAYLOAD",
      });
    }

    try {
      const result = await dormService.updateDormStatus(
        dormId,
        isPublished,
        user.sub,
      );
      return reply.send(result);
    } catch (error: any) {
      if (error.message === "FORBIDDEN") {
        return reply.status(403).send({
          message: "FORBIDDEN",
        });
      }

      if (error.message === "NOT_FOUND") {
        return reply.status(404).send({
          message: "DORM_NOT_FOUND",
        });
      }

      if (error.message === "INVALID_DORM_ID") {
        return reply.status(400).send({
          message: "INVALID_DORM_ID",
        });
      }

      return reply.status(500).send({
        message: "UPDATE_STATUS_FAILED",
      });
    }
  },

  async uploadDormImage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user as UserDecodedDto;

      if (!user)
        return reply.status(401).send({
          message: "UNAUTHORIZED",
        });

      const { dormId } = request.params as {
        dormId: string;
      };

      const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

      if (!ownerDorm)
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      const parts = request.files({
        limits: {
          fileSize: 10 * 1024 * 1024,
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
            console.warn(`⚠️ File too large skipped: ${part.filename}`);

            return reply.status(413).send({
              message: `FILE_TOO_LARGE`,
              filename: part.filename,
            });
          }

          console.error("Error reading stream part:", error);
        }
      }

      if (filesToProcess.length === 0) {
        return reply.status(400).send({
          message: "NO_FILE_UPLOADED",
        });
      }

      const uploadPromises = filesToProcess.map(async (fileData) => {
        let optimizedBuffer = fileData.buffer;

        try {
          if (
            fileData.mimetype === "image/jpeg" ||
            fileData.mimetype === "image/jpg"
          ) {
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
          console.error("Optimization failed, using original", e);
        }

        const extension = extname(fileData.filename);
        const objectKey = `dorms/${dormId}/${randomUUID()}${extension}`;

        return dormService.uploadDormImage(
          optimizedBuffer,
          dormId,
          objectKey,
          fileData.mimetype,
          optimizedBuffer.length,
        );
      });

      const uploadedImages = await Promise.all(uploadPromises);
      return reply.send(uploadedImages);
    } catch (error) {
      console.error("💥 UPLOAD ERROR:", error);

      return reply.status(500).send({
        message: "UPLOAD_FAILED",
      });
    }
  },

  async deleteDormImage(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { imageId } = request.params as {
      imageId: string;
    };

    try {
      const image = await dormService.getDormImageById(imageId);

      if (!image)
        return reply.status(404).send({
          message: "Image not found",
        });

      if (!image.dormitoryId) {
        return reply.status(400).send({
          message: "Invalid dormitory ID",
        });
      }

      const isOwner = await dormService.isOwnerOfDorm(
        image.dormitoryId,
        user.sub,
      );

      if (!isOwner)
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      await dormService.deleteDormImage(imageId);

      reply.send({
        success: true,
      });
    } catch (error: any) {
      logger.error(error);

      reply.status(500).send({
        message: "DELETE_FAILED",
      });
    }
  },

  async reorderDormImages(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { dormId } = request.params as {
      dormId: string;
    };

    const { images } = request.body as {
      images: {
        id: string;
        order: number;
        isCover: boolean;
      }[];
    };

    if (!images || !Array.isArray(images)) {
      return reply.status(400).send({
        message: "Invalid payload",
      });
    }

    try {
      const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

      if (!ownerDorm)
        return reply.status(403).send({
          message: "FORBIDDEN",
        });

      await dormService.reorderDormImages(dormId, images);

      reply.send({
        success: true,
      });
    } catch (error: any) {
      logger.error(error);

      reply.status(500).send({
        message: "REORDER_FAILED",
      });
    }
  },

  async getDormOverview(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { dormId } = request.params as {
      dormId: string;
    };

    const { month, year } = request.query as {
      month?: string;
      year?: string;
    };

    if (!dormId) {
      return reply.status(400).send({
        message: "DORM_ID_REQUIRED",
      });
    }

    try {
      const now = new Date();
      const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
      const targetYear = year ? parseInt(year) : now.getFullYear();
      const overview = await dormService.getDormOverview(
        dormId,
        user.sub,
        targetMonth,
        targetYear,
      );
      return reply.send(overview);
    } catch (error: any) {
      console.error(error);

      if (error.message === "FORBIDDEN") {
        return reply.status(403).send({
          message: "FORBIDDEN",
        });
      }

      reply.status(500).send({
        message: "FAILED_TO_FETCH_OVERVIEW",
      });
    }
  },

  async deleteDorm(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user)
      return reply.status(401).send({
        message: "UNAUTHORIZED",
      });

    const { dormId } = request.params as {
      dormId: string;
    };

    if (!dormId) {
      return reply.status(400).send({
        message: "DORM_ID_REQUIRED",
      });
    }

    try {
      await dormService.deleteDorm(dormId, user.sub);

      return reply.send({
        success: true,
        message: "DORM_DELETED",
      });
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "FORBIDDEN") {
        return reply.status(403).send({
          message: "FORBIDDEN",
        });
      }

      if (error.message === "NOT_FOUND") {
        return reply.status(404).send({
          message: "DORM_NOT_FOUND",
        });
      }

      return reply.status(500).send({
        message: "DELETE_FAILED",
      });
    }
  },
};
