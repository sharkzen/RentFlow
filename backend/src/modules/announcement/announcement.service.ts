import prisma from "@/lib/prisma";
import { generateSignedUrl, uploadFile, deleteFile } from "@/services/r2Client";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { AnnouncementType, FileCategory } from "@prisma/client";
import { emailQueue } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env";

export const AnnouncementService = {
  _verifyOwnership: async (announcementId: string, userId: string) => {
    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
      },

      select: {
        dormitoryId: true,
      },
    });

    if (!announcement) throw new Error("NOT_FOUND");

    const isOwner = await prisma.dormitory.findFirst({
      where: {
        id: announcement.dormitoryId,

        owner: {
          userId: userId,
        },
      },
    });

    if (!isOwner) throw new Error("FORBIDDEN");

    return announcement;
  },

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

        orderBy: [
          {
            isPinned: "desc",
          },
          {
            order: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

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

        orderBy: [
          {
            isPinned: "desc",
          },
          {
            order: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

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
          isPinned: ann.isPinned,
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
    ownerId,
    title,
    content,
    type = "NORMAL",
    sendEmail = true,
    imageBuffer,
  }: {
    dormitoryId: string;
    ownerId: string;
    title: string;
    content: string;
    type?: AnnouncementType;
    sendEmail?: boolean;
    imageBuffer?: Buffer;
  }) => {
    const isOwner = await prisma.dormitory.findFirst({
      where: {
        id: dormitoryId,

        owner: {
          userId: ownerId,
        },
      },
    });

    if (!isOwner) throw new Error("FORBIDDEN");

    let imageRecord: any = undefined;

    if (imageBuffer) {
      const webpBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
        })
        .toBuffer();

      const objectKey = `announcements/${dormitoryId}/${uuidv4()}.webp`;
      await uploadFile(webpBuffer, objectKey, "image/webp");

      imageRecord = {
        objectKey,
        bucket: env.BUCKET,
        category: FileCategory.ANNOUNCEMENT,
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
        isEmailSent: false,

        images: imageRecord
          ? {
              create: imageRecord,
            }
          : undefined,
      },

      include: {
        images: true,
      },
    });

    console.log("📢 sendEmail flag:", sendEmail);

    if (sendEmail) {
      const tenants = await prisma.tenantProfile.findMany({
        where: {
          room: {
            dormitoryId,
          },

          isActive: true,
        },

        include: {
          user: true,
        },
      });

      console.log("👥 tenants found:", tenants.length);
      console.log(
        "📧 tenant emails:",
        tenants.map((t) => t.user.email),
      );
      const imageUrl = announcement.images?.[0]?.objectKey
        ? await generateSignedUrl(
            announcement.images[0].objectKey,
            60 * 60 * 24 * 7,
          )
        : null;

      for (const tenant of tenants) {
        const email = tenant.user.email;
        console.log("📨 adding to queue:", email);

        const job = await emailQueue.add({
          type: EmailType.ANNOUNCEMENT,
          to: email,

          data: {
            dormName: isOwner.name,
            title,
            content,
            type,

            date: new Date().toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Bangkok",
            }),

            imageUrl,
          },
        });

        console.log("✅ job added:", job.id);
      }

      await prisma.announcement.update({
        where: {
          id: announcement.id,
        },

        data: {
          isEmailSent: true,
        },
      });
    }

    return announcement;
  },

  updateAnnouncement: async (
    id: string,
    data: {
      ownerId: string;
      title: string;
      content: string;
      type: AnnouncementType;
      isActive: boolean;
      removeImage: boolean;
      imageBuffer?: Buffer;
    },
  ) => {
    const announcement = await AnnouncementService._verifyOwnership(
      id,
      data.ownerId,
    );
    let imageConnectOrCreate: any = undefined;

    const oldFiles = await prisma.file.findMany({
      where: {
        announcementId: id,
      },
    });

    if (data.imageBuffer) {
      for (const file of oldFiles) {
        try {
          await deleteFile(file.objectKey);
        } catch (err) {
          console.error(
            `Failed to delete old file from R2: ${file.objectKey}`,
            err,
          );
        }
      }

      await prisma.file.deleteMany({
        where: {
          announcementId: id,
        },
      });

      const webpBuffer = await sharp(data.imageBuffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
        })
        .toBuffer();

      const objectKey = `announcements/${announcement.dormitoryId}/${uuidv4()}.webp`;
      await uploadFile(webpBuffer, objectKey, "image/webp");

      imageConnectOrCreate = {
        create: {
          objectKey,
          bucket: env.BUCKET,
          category: FileCategory.ANNOUNCEMENT,
          mimeType: "image/webp",
          size: webpBuffer.length,
        },
      };
    } else if (data.removeImage) {
      for (const file of oldFiles) {
        try {
          await deleteFile(file.objectKey);
        } catch (err) {
          console.error(
            `Failed to delete file from R2: ${file.objectKey}`,
            err,
          );
        }
      }

      await prisma.file.deleteMany({
        where: {
          announcementId: id,
        },
      });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: {
        id,
      },

      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        isActive: data.isActive,
        images: imageConnectOrCreate,
      },

      include: {
        images: true,
      },
    });

    return updatedAnnouncement;
  },

  deleteAnnouncement: async (id: string, ownerId: string) => {
    await AnnouncementService._verifyOwnership(id, ownerId);

    const files = await prisma.file.findMany({
      where: {
        announcementId: id,
      },
    });

    for (const file of files) {
      try {
        await deleteFile(file.objectKey);
      } catch (err) {
        console.error(
          `Failed to delete file from R2 during announcement deletion: ${file.objectKey}`,
          err,
        );
      }
    }

    await prisma.$transaction([
      prisma.file.deleteMany({
        where: {
          announcementId: id,
        },
      }),
      prisma.announcementReadLog.deleteMany({
        where: {
          announcementId: id,
        },
      }),
      prisma.announcement.delete({
        where: {
          id,
        },
      }),
    ]);

    return {
      success: true,
    };
  },

  togglePinAnnouncement: async (id: string, ownerId: string) => {
    await AnnouncementService._verifyOwnership(id, ownerId);

    const announcement = await prisma.announcement.findUnique({
      where: {
        id,
      },

      select: {
        isPinned: true,
      },
    });

    const updated = await prisma.announcement.update({
      where: {
        id,
      },

      data: {
        isPinned: !announcement?.isPinned,
      },
    });

    return updated;
  },

  reorderAnnouncements: async (
    items: {
      id: string;
      order: number;
    }[],
    ownerId: string,
  ) => {
    if (items.length === 0) return;

    await AnnouncementService._verifyOwnership(items[0].id, ownerId);

    await prisma.$transaction(
      items.map((item) =>
        prisma.announcement.update({
          where: {
            id: item.id,
          },

          data: {
            order: item.order,
          },
        }),
      ),
    );

    return {
      success: true,
    };
  },

  deleteImage: async (imageId: string, ownerId: string) => {
    const file = await prisma.file.findUnique({
      where: {
        id: imageId,
      },

      select: {
        id: true,
        objectKey: true,
        announcementId: true,
      },
    });

    if (!file || !file.announcementId) {
      throw new Error("NOT_FOUND");
    }

    await AnnouncementService._verifyOwnership(file.announcementId, ownerId);

    try {
      await deleteFile(file.objectKey);
    } catch (err) {
      console.error(`Failed to delete file from R2: ${file.objectKey}`, err);
    }

    await prisma.file.delete({
      where: {
        id: imageId,
      },
    });

    return {
      success: true,
    };
  },

  markAnnouncementAsRead: async (announcementId: string, tenantId: string) => {
    return await prisma.announcementReadLog.upsert({
      where: {
        announcementId_tenantId: {
          announcementId,
          tenantId,
        },
      },

      update: {},

      create: {
        announcementId,
        tenantId,
      },
    });
  },
};
