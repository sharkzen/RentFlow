import prisma from "@/lib/prisma";
import { generateSignedUrl } from "@/services/r2Client";

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
};
