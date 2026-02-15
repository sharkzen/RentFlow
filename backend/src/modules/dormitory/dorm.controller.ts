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
      logger.error(error);

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

    const { name } = request.body as {
      name: string;
    };

    logger.info(name);

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
            logger.warn(`⚠️ File too large skipped: ${part.filename}`);

            return reply.status(413).send({
              message: `FILE_TOO_LARGE`,
              filename: part.filename,
            });
          }

          logger.error("Error reading stream part:", error);
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
        } catch (error: any) {
          logger.error("Optimization failed, using original", error);
        }

        const extension = extname(fileData.filename);
        const objectKey = `dorms/${dormId}/${randomUUID()}${extension}`;

        return dormService.uploadDormImage(
          optimizedBuffer,
          dormId,
          objectKey,
          fileData.mimetype,
          optimizedBuffer.length,
          user.sub,
        );
      });

      const uploadedImages = await Promise.all(uploadPromises);
      return reply.send(uploadedImages);
    } catch (error: any) {
      logger.error(`UPLOAD ERROR: ${error}`);

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

      await dormService.deleteDormImage(imageId, user.sub);

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

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
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
      const overview = await dormService.getDashboard(
        dormId,
        user.sub,
        month,
        year,
      );
      return reply.send(overview);
    } catch (error: any) {
      logger.error(error);

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

    if (!user) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    const { dormId } = request.params as {
      dormId: string;
    };

    if (!dormId) {
      return reply.status(400).send({
        code: "DORM_ID_REQUIRED",
        message: "Dormitory ID is required",
      });
    }

    try {
      await dormService.deleteDorm(dormId, user.sub);

      return reply.send({
        success: true,
        code: "DORM_DELETED_SUCCESS",
        message: "Dormitory has been permanently deleted",
      });
    } catch (error: any) {
      logger.error(`Delete Dorm Error: ${error.message}`);

      switch (error.message) {
        case "DORM_NOT_EMPTY":
          return reply.status(409).send({
            code: "DORM_HAS_DEPENDENCIES",
            message:
              "Cannot delete dormitory because it contains rooms or active tenants. Please delete all rooms first.",
          });
        case "FORBIDDEN":
          return reply.status(403).send({
            code: "FORBIDDEN_ACCESS",
            message: "You don't have permission to delete this dormitory",
          });
        case "NOT_FOUND":
          return reply.status(404).send({
            code: "DORM_NOT_FOUND",
            message: "Dormitory not found",
          });
        case "OWNER_PROFILE_NOT_FOUND":
          return reply.status(403).send({
            code: "OWNER_PROFILE_NOT_FOUND",
            message: "Owner profile not found",
          });
        default:
          return reply.status(500).send({
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected error occurred",
          });
      }
    }
  },
};
