import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { minioClient, generateSignedUrl } from "@/services/minio";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DormFormDataDto } from "@/modules/dormitory/dtos/dorm.dto";
import { generateSlug } from "@/lib/text";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
export const dormService = {
  async createDorm(name: string, userId: string) {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!owner) throw new Error("FORBIDDEN");

    const dorm = await prisma.dormitory.create({
      data: {
        name: name,
        slug: generateSlug(name),
        ownerId: owner.id,
        address: "",
        latitude: 0,
        longitude: 0,
        mapUrl: "",
        isPublished: false,
      },
    });

    return dorm;
  },
  async getDormImageById(imageId: string) {
    return await prisma.file.findUnique({
      where: { id: imageId },
    });
  },
  async updateDormStatus(dormId: string, isPublished: boolean, userId: string) {
    if (!dormId) {
      throw new Error("INVALID_DORM_ID");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        ownerProfile: {
          select: { id: true },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new Error("FORBIDDEN");
    }

    if (!user.ownerProfile) {
      throw new Error("FORBIDDEN");
    }

    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!dorm) {
      throw new Error("NOT_FOUND");
    }

    if (dorm.ownerId !== user.ownerProfile.id) {
      throw new Error("FORBIDDEN");
    }

    return await prisma.dormitory.update({
      where: { id: dormId },
      data: {
        isPublished,
      },
      select: {
        id: true,
        isPublished: true,
        updatedAt: true,
      },
    });
  },
  async updateDorm(dorm: DormFormDataDto, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!ownerProfile) throw new Error("FORBIDDEN");

    const existingDorm = await prisma.dormitory.findUnique({
      where: { id: dorm.id },
    });

    if (!existingDorm || existingDorm.ownerId !== ownerProfile.id) {
      throw new Error("FORBIDDEN");
    }

    const slug = generateSlug(dorm.name);
    const latLng = await getLatLngFromUrl(dorm.mapUrl ?? 0);
    return await prisma.$transaction(async (tx) => {
      const updatedDorm = await tx.dormitory.update({
        where: { id: dorm.id },
        data: {
          name: dorm.name,
          slug: slug,
          description: dorm.description,
          address: dorm.address,
          latitude: latLng?.lat ?? 0,
          longitude: latLng?.lng ?? 0,
          mapUrl: dorm.mapUrl,
          status: "ACTIVE",
        },
      });

      const setting = await tx.dormitorySetting.upsert({
        where: { dormitoryId: dorm.id },
        update: {
          roomPrice: Number(dorm.roomPrice),
          waterRate: Number(dorm.waterRate),
          electricRate: Number(dorm.electricRate),
          commonFee: Number(dorm.commonFee ?? 0),
          lateFee: Number(dorm.lateFee ?? 0),
          dueDay: Number(dorm.dueDay),
          dueMonthOffset: Number(dorm.dueMonthOffset ?? 1),
        },
        create: {
          dormitoryId: dorm.id,
          roomPrice: Number(dorm.roomPrice),
          waterRate: Number(dorm.waterRate),
          electricRate: Number(dorm.electricRate),
          commonFee: Number(dorm.commonFee ?? 0),
          lateFee: Number(dorm.lateFee ?? 0),
          dueDay: Number(dorm.dueDay),
          dueMonthOffset: Number(dorm.dueMonthOffset ?? 1),
        },
      });

      return {
        ...updatedDorm,
        settings: setting,
      };
    });
  },
  async getOwnerDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!ownerProfile) return null;

    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormId },
    });

    if (!dorm) return null;
    if (dorm.ownerId !== ownerProfile.id) return null;

    return dorm;
  },
  async isOwnerOfDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!ownerProfile) return false;

    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormId },
      select: { ownerId: true },
    });

    return dorm?.ownerId === ownerProfile.id;
  },
  async getDorms(user: UserDecodedDto) {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: user.sub },
    });
    if (!owner) throw new Error("UNAUTHORIZED");

    const dorms = await prisma.dormitory.findMany({
      where: { ownerId: owner.id },
      include: {
        settings: true,
        images: true,
        owner: true,
      },
    });

    if (dorms.length === 0) return [];

    const dormsWithUrl = await Promise.all(
      dorms.map(async (dorm) => {
        const imagesWithUrl = await Promise.all(
          dorm.images.map(async (img) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey, img.bucket),
          }))
        );

        return {
          ...dorm,
          images: imagesWithUrl,
        };
      })
    );

    return dormsWithUrl;
  },

  uploadDormImage: async (
    file: Buffer,
    dormId: string,
    objectKey: string,
    bucket: string,
    mimeType: string,
    size: number,
    isCover = false
  ) => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: file,
      ContentType: mimeType,
    });
    await minioClient.send(command);

    const image = await prisma.file.create({
      data: {
        dormitoryId: dormId,
        bucket,
        objectKey,
        mimeType,
        size,
        category: "DORMITORY",
        isCover,
      },
    });

    return image;
  },

  deleteDormImage: async (imageId: string) => {
    const image = await prisma.file.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new Error("Image not found");

    const command = new DeleteObjectCommand({
      Bucket: image.bucket,
      Key: image.objectKey,
    });
    await minioClient.send(command);

    await prisma.file.delete({ where: { id: imageId } });

    return true;
  },

  getDormImages: async (dormId: string) => {
    const images = await prisma.file.findMany({
      where: { dormitoryId: dormId, category: "DORMITORY" },
      orderBy: [{ isCover: "desc" }, { order: "asc" }, { createdAt: "asc" }],
    });

    const imagesWithUrl = await Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await generateSignedUrl(img.objectKey, img.bucket),
      }))
    );

    return imagesWithUrl;
  },
  async reorderDormImages(
    dormId: string,
    images: { id: string; order: number; isCover: boolean }[]
  ) {
    const existingImages = await prisma.file.findMany({
      where: { dormitoryId: dormId, category: "DORMITORY" },
    });

    const existingIds = existingImages.map((img) => img.id);
    const invalid = images.filter((img) => !existingIds.includes(img.id));
    if (invalid.length > 0) {
      throw new Error("Some images do not belong to this dormitory");
    }

    const updatePromises = images.map((img) =>
      prisma.file.update({
        where: { id: img.id },
        data: { order: img.order, isCover: img.isCover },
      })
    );

    await Promise.all(updatePromises);
    return true;
  },
  async getDormOverview(dormId: string, userId: string) {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) throw new Error("FORBIDDEN");

    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormId },
      select: { id: true, ownerId: true },
    });

    if (!dorm || dorm.ownerId !== owner.id) {
      throw new Error("FORBIDDEN");
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalRooms,
      occupiedRooms,
      availableRooms,

      paidBills,
      unpaidBills,

      pendingBills,
      overdueBills,

      openMaintenance,
      inProgressMaintenance,
    ] = await Promise.all([
      prisma.room.count({ where: { dormitoryId: dormId } }),

      prisma.room.count({
        where: { dormitoryId: dormId, status: "OCCUPIED" },
      }),

      prisma.room.count({
        where: { dormitoryId: dormId, status: "AVAILABLE" },
      }),

      prisma.bill.aggregate({
        where: {
          room: { dormitoryId: dormId },
          status: "PAID",
          billingMonth: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),

      prisma.bill.aggregate({
        where: {
          room: { dormitoryId: dormId },
          status: { in: ["PENDING", "OVERDUE"] },
        },
        _sum: { total: true },
      }),

      prisma.bill.count({
        where: {
          room: { dormitoryId: dormId },
          status: "PENDING",
        },
      }),

      prisma.bill.count({
        where: {
          room: { dormitoryId: dormId },
          status: "OVERDUE",
        },
      }),

      prisma.maintenanceRequest.count({
        where: {
          dormitoryId: dormId,
          status: "OPEN",
        },
      }),

      prisma.maintenanceRequest.count({
        where: {
          dormitoryId: dormId,
          status: "IN_PROGRESS",
        },
      }),
    ]);

    return {
      dormId,
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
      },
      income: {
        thisMonth: paidBills._sum.total ?? 0,
        unpaid: unpaidBills._sum.total ?? 0,
      },
      bills: {
        pending: pendingBills,
        overdue: overdueBills,
      },
      maintenance: {
        open: openMaintenance,
        inProgress: inProgressMaintenance,
      },
    };
  },
};
