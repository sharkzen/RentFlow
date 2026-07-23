import { FastifyRequest, FastifyReply } from "fastify";
import { extname } from "path";
import { randomUUID } from "crypto";
import { dormService } from "@/modules/dormitory/dorm.service";
import sharp from "sharp";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import {
  DormFormDataDto,
  GetDormsQueryDto,
} from "@/modules/dormitory/dto/dorm.dto";
import logger from "@/utils/logger";
import { AppError } from "@/lib/errors";

export const DormController = {
  async getAllDorms(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as GetDormsQueryDto;
    const dorms = await dormService.getAllDorms(query);
    return reply.send(dorms);
  },

  async getDormSlug(request: FastifyRequest, reply: FastifyReply) {
    const { slug } = request.params as {
      slug: string;
    };

    if (!slug) {
      throw AppError.badRequest("SLUG_REQUIRED");
    }

    const decodedSlug = decodeURIComponent(slug);
    const dorm = await dormService.getDormSlug(decodedSlug);

    if (!dorm) {
      throw AppError.notFound("DORM_NOT_FOUND");
    }

    return reply.send(dorm);
  },

  async createDorm(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { name } = request.body as {
      name: string;
    };

    logger.info(name);

    if (!name) throw AppError.badRequest("NAME_REQUIRED");

    const dorm = await dormService.createDorm(name, user.sub);
    logger.info(dorm);
    return reply.status(201).send(dorm);
  },

  async getDorms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const dorms = await dormService.getDorms(user);
    reply.send(dorms);
  },

  async updateDorms(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const dorm = request.body as DormFormDataDto;

    try {
      const updated = await dormService.updateDorm(dorm, user.sub);
      return reply.send(updated);
    } catch (error: any) {
      if (error.message === "FORBIDDEN") {
        throw AppError.forbidden("FORBIDDEN");
      }

      throw AppError.internal("UPDATE_FAILED");
    }
  },

  async getDormImages(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

    if (!ownerDorm) throw AppError.forbidden("FORBIDDEN");

    const images = await dormService.getDormImages(dormId);
    reply.send(images);
  },

  async updateDormStatus(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId?: string;
    };

    const { isPublished } = request.body as {
      isPublished?: boolean;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
    }

    if (typeof isPublished !== "boolean") {
      throw AppError.badRequest("INVALID_PAYLOAD");
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
        throw AppError.forbidden("FORBIDDEN");
      }

      if (error.message === "NOT_FOUND") {
        throw AppError.notFound("DORM_NOT_FOUND");
      }

      if (error.message === "INVALID_DORM_ID") {
        throw AppError.badRequest("INVALID_DORM_ID");
      }

      throw AppError.internal("UPDATE_STATUS_FAILED");
    }
  },

  async uploadDormImage(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

    if (!ownerDorm) throw AppError.forbidden("FORBIDDEN");

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
      throw AppError.badRequest("NO_FILE_UPLOADED");
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
  },

  async deleteDormImage(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { imageId } = request.params as {
      imageId: string;
    };

    const image = await dormService.getDormImageById(imageId);

    if (!image) throw AppError.notFound("IMAGE_NOT_FOUND");

    if (!image.dormitoryId) {
      throw AppError.badRequest("INVALID_DORMITORY_ID");
    }

    const isOwner = await dormService.isOwnerOfDorm(
      image.dormitoryId,
      user.sub,
    );

    if (!isOwner) throw AppError.forbidden("FORBIDDEN");

    await dormService.deleteDormImage(imageId, user.sub);

    reply.send({
      success: true,
    });
  },

  async reorderDormImages(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

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
      throw AppError.badRequest("INVALID_PAYLOAD");
    }

    const ownerDorm = await dormService.getOwnerDorm(dormId, user.sub);

    if (!ownerDorm) throw AppError.forbidden("FORBIDDEN");

    await dormService.reorderDormImages(dormId, images, user.sub);

    reply.send({
      success: true,
    });
  },

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const { month, year } = request.query as {
      month?: string;
      year?: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
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
      if (error.message === "FORBIDDEN") {
        throw AppError.forbidden("FORBIDDEN");
      }

      throw AppError.internal("FAILED_TO_FETCH_OVERVIEW");
    }
  },

  async exportDashboard(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) throw AppError.unauthorized("UNAUTHORIZED");

    const { dormId } = request.params as {
      dormId: string;
    };

    const { month, year } = request.query as {
      month?: string;
      year?: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED");
    }

    try {
      const { pdfBuffer, filename } = await dormService.exportDashboardPdf(
        dormId,
        user.sub,
        month,
        year,
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
      if (error.message === "FORBIDDEN") {
        throw AppError.forbidden("FORBIDDEN");
      }

      throw AppError.internal("FAILED_TO_EXPORT_REPORT");
    }
  },

  async deleteDorm(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as UserDecodedDto;

    if (!user) {
      throw AppError.unauthorized("UNAUTHORIZED", "User not authenticated");
    }

    const { dormId } = request.params as {
      dormId: string;
    };

    if (!dormId) {
      throw AppError.badRequest("DORM_ID_REQUIRED", "Dormitory ID is required");
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
          throw AppError.conflict(
            "DORM_HAS_DEPENDENCIES",
            "Cannot delete dormitory because it contains rooms or active tenants. Please delete all rooms first.",
          );
        case "FORBIDDEN":
          throw AppError.forbidden(
            "FORBIDDEN_ACCESS",
            "You don't have permission to delete this dormitory",
          );
        case "NOT_FOUND":
          throw AppError.notFound("DORM_NOT_FOUND", "Dormitory not found");
        case "OWNER_PROFILE_NOT_FOUND":
          throw AppError.forbidden(
            "OWNER_PROFILE_NOT_FOUND",
            "Owner profile not found",
          );
        default:
          throw AppError.internal(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
          );
      }
    }
  },
};
