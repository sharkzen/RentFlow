import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { minioClient, generateSignedUrl } from "@/services/minio";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import {
  DormFormDataDto,
  GetDormsQueryDto,
} from "@/modules/dormitory/dtos/dorm.dto";
import { generateSlug } from "@/lib/text";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { formatDistance, getDistance } from "@/utils/geo";
import { Prisma, Status } from "@prisma/client";
import logger from "@/utils/logger";
export const dormService = {
  async getAllDorms(query: GetDormsQueryDto) {
    const { search, minPrice, maxPrice, landmarkId } = query;

    const whereCondition: Prisma.DormitoryWhereInput = {
      status: Status.ACTIVE,
      isPublished: true,
    };

    if (
      search &&
      search !== "null" &&
      search !== "undefined" &&
      search.trim() !== ""
    ) {
      whereCondition.name = { contains: search, mode: "insensitive" };
    }

    const parsedMin =
      minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined;
    const parsedMax =
      maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined;

    if (parsedMin !== undefined || parsedMax !== undefined) {
      whereCondition.settings = {
        roomPrice: {
          gte: parsedMin,
          lte: parsedMax,
        },
      };
    }

    const dorms = await prisma.dormitory.findMany({
      where: whereCondition,
      include: {
        images: {
          where: { isCover: true },
        },
        settings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const cleanLandmarkId =
      landmarkId &&
      landmarkId !== "null" &&
      landmarkId !== "undefined" &&
      landmarkId !== ""
        ? landmarkId
        : undefined;

    const landmarks = await prisma.landmark.findMany({
      where: {
        status: Status.ACTIVE,
        ...(cleanLandmarkId ? { id: cleanLandmarkId } : {}),
      },
    });

    const dormsWithData = await Promise.all(
      dorms.map(async (dorm) => {
        const imagesWithUrl = await Promise.all(
          dorm.images.map(async (img) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey, img.bucket),
          }))
        );

        let nearestLandmark = null;
        let minDistance = Infinity;

        if (landmarks.length > 0) {
          for (const landmark of landmarks) {
            if (!landmark.latitude || !landmark.longitude) continue;

            const dist = getDistance(
              dorm.latitude,
              dorm.longitude,
              landmark.latitude,
              landmark.longitude
            );

            if (dist < minDistance) {
              minDistance = dist;
              nearestLandmark = landmark;
            }
          }
        }

        return {
          ...dorm,
          images: imagesWithUrl,
          nearby: nearestLandmark
            ? {
                name: nearestLandmark.name,
                slug: nearestLandmark.slug,
                distanceKm: Number(minDistance.toFixed(2)),
                distanceText: formatDistance(minDistance),
              }
            : null,
        };
      })
    );

    if (cleanLandmarkId && landmarks.length > 0) {
      dormsWithData.sort(
        (a, b) => (a.nearby?.distanceKm || 0) - (b.nearby?.distanceKm || 0)
      );
    }

    return dormsWithData;
  },

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
      orderBy: [{ isPublished: "desc" }, { createdAt: "asc" }],
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
    size: number
  ) => {
    const existingCount = await prisma.file.count({
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
      },
    });

    const isCover = existingCount === 0;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: file,
      ContentType: mimeType,
    });

    await minioClient.send(command);

    return prisma.file.create({
      data: {
        dormitoryId: dormId,
        bucket,
        objectKey,
        mimeType,
        size,
        category: "DORMITORY",
        isCover,
        order: existingCount,
      },
    });
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
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
      },
    });

    const existingIds = existingImages.map((img) => img.id);

    const invalid = images.filter((img) => !existingIds.includes(img.id));
    if (invalid.length > 0) {
      throw new Error("Some images do not belong to this dormitory");
    }

    const coverCount = images.filter((img) => img.isCover).length;
    if (coverCount !== 1) {
      throw new Error("Dormitory must have exactly one cover image");
    }

    await prisma.file.updateMany({
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
      },
      data: {
        isCover: false,
      },
    });

    const updatePromises = images.map((img) =>
      prisma.file.update({
        where: { id: img.id },
        data: {
          order: img.order,
          isCover: img.isCover,
        },
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
  async deleteDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });

    if (!ownerProfile) throw new Error("FORBIDDEN");

    const dorm = await prisma.dormitory.findUnique({
      where: { id: dormId },
    });

    if (!dorm) {
      throw new Error("NOT_FOUND");
    }

    if (dorm.ownerId !== ownerProfile.id) {
      throw new Error("FORBIDDEN");
    }

    return await prisma.dormitory.update({
      where: { id: dormId },
      data: {
        deletedAt: new Date(),
        status: "BANNED",
        isPublished: false,
      },
    });
  },
};
