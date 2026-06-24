import prisma from "@/lib/prisma";
import { generateSignedUrl } from "@/services/r2Client";
import sharp from "sharp";
import { uploadFile } from "@/services/r2Client";
import { uuidv4 } from "zod";
export const AnnouncementService = {
  getOwnerAnnouncements: async (
    dormitoryId: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          dormitoryId,
        },

        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          images: true,
          readLogs: true,
        },
      }),
      prisma.announcement.count({
        where: {
          dormitoryId,
        },
      }),
    ]);

    const mappedAnnouncements = await Promise.all(
      announcements.map(async (ann) => {
        const imagesWithUrls = await Promise.all(
          ann.images.map(async (img) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey),
          })),
        );

        return {
          ...ann,
          images: imagesWithUrls,
          readCount: ann.readLogs.length,
        };
      }),
    );

    return {
      data: mappedAnnouncements,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getTenantAnnouncements: async (
    dormitoryId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 10,
  ) => {
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          dormitoryId,
          isActive: true,
        },

        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          images: true,

          readLogs: {
            where: {
              tenantId,
            },
          },
        },
      }),
      prisma.announcement.count({
        where: {
          dormitoryId,
          isActive: true,
        },
      }),
    ]);

    const mappedAnnouncements = await Promise.all(
      announcements.map(async (ann) => {
        const imagesWithUrls = await Promise.all(
          ann.images.map(async (img) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey),
          })),
        );

        return {
          id: ann.id,
          title: ann.title,
          content: ann.content,
          type: ann.type,
          createdAt: ann.createdAt,
          images: imagesWithUrls,
          isRead: ann.readLogs.length > 0,
        };
      }),
    );

    return {
      data: mappedAnnouncements,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  createAnnouncement: async ({
    dormitoryId,
    title,
    content,
    type = "NORMAL",
    sendEmail = true,
    imageFile,
  }: {
    dormitoryId: string;
    title: string;
    content: string;
    type?: "NORMAL" | "IMPORTANT" | "URGENT";
    sendEmail?: boolean;
    imageFile?: any;
  }) => {
    let imageRecord:
      | {
          objectKey: string;
          bucket: string;
          category: "ANNOUNCEMENT";
          mimeType: string;
          size: number;
        }
      | undefined = undefined;

    if (imageFile) {
      const buffer = await imageFile.toBuffer();

      const webpBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const objectKey = `announcements/${dormitoryId}/${uuidv4()}.webp`;
      await uploadFile(webpBuffer, objectKey, "image/webp");

      imageRecord = {
        objectKey,
        bucket: process.env.S3_BUCKET!,
        category: "ANNOUNCEMENT",
        mimeType: "image/webp",
        size: webpBuffer.length,
      };
    }

    const announcement = await prisma.announcement.create({
      data: {
        dormitoryId,
        title,
        content,
        type,
        isEmailSent: false, // จะส่งแยกทีหลัง
        images: imageRecord ? { create: imageRecord } : undefined,
      },
      include: {
        images: true,
      },
    });

    // TODO: ถ้า sendEmail === true ให้ trigger email service ตรงนี้

    return announcement;
  },
};
