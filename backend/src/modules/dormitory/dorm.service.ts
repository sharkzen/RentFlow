import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import {
  r2Client,
  deleteFile,
  uploadFile,
  generateSignedUrl,
} from "@/services/r2Client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import {
  DormFormDataDto,
  GetDormsQueryDto,
} from "@/modules/dormitory/dto/dorm.dto";
import { generateSlug } from "@/lib/text";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { formatDistance, getDistance } from "@/utils/geo";
import { FileCategory, Prisma, RoomStatus, Status } from "@prisma/client";
import { shuffleArray } from "./lib/dorm.lib";
import logger from "@/utils/logger";
import { createActivityLog } from "@/services/activity-log.service";
import sharp from "sharp";

export const dormService = {
  async getAllDorms(query: GetDormsQueryDto) {
    const { search, minPrice, maxPrice, landmarkId, page = 1 } = query;

    const limit = 15;
    const skip = (Number(page) - 1) * limit;

    const whereCondition: Prisma.DormitoryWhereInput = {
      status: "ACTIVE",
      isPublished: true,
    };

    const hasSearch = search && search.trim() !== "" && search !== "null";
    const hasPriceFilter =
      (minPrice && !isNaN(Number(minPrice))) ||
      (maxPrice && !isNaN(Number(maxPrice)));
    const cleanLandmarkId =
      landmarkId &&
      landmarkId !== "null" &&
      landmarkId !== "undefined" &&
      landmarkId !== ""
        ? landmarkId
        : undefined;

    if (hasSearch) {
      whereCondition.name = {
        contains: search,
        mode: "insensitive",
      };
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

    let resultDorms: any[] = [];
    let totalItems = 0;

    const dormIncludeQuery = {
      images: true,
      settings: true,

      rooms: {
        where: {
          deletedAt: null,
        },

        select: {
          status: true,
        },
      },
    };

    if (cleanLandmarkId) {
      const targetLandmark = await prisma.landmark.findUnique({
        where: {
          id: cleanLandmarkId,
        },
      });

      if (!targetLandmark) {
        return {
          data: [],

          meta: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const allMatchingDorms = await prisma.dormitory.findMany({
        where: whereCondition,
        include: dormIncludeQuery,
      });

      const dormsWithDistance = allMatchingDorms.map((dorm) => {
        let dist = Infinity;

        if (
          dorm.latitude &&
          dorm.longitude &&
          targetLandmark.latitude &&
          targetLandmark.longitude
        ) {
          dist = getDistance(
            dorm.latitude,
            dorm.longitude,
            targetLandmark.latitude,
            targetLandmark.longitude,
          );
        }

        return {
          ...dorm,
          _distance: dist,
          _targetLandmark: targetLandmark,
        };
      });

      dormsWithDistance.sort((a, b) => {
        const aHasAvailable = a.rooms?.some(
          (r: any) => r.status === "AVAILABLE",
        );
        const bHasAvailable = b.rooms?.some(
          (r: any) => r.status === "AVAILABLE",
        );

        if (aHasAvailable && !bHasAvailable) return -1;

        if (!aHasAvailable && bHasAvailable) return 1;

        return a._distance - b._distance;
      });

      totalItems = dormsWithDistance.length;
      resultDorms = dormsWithDistance.slice(skip, skip + limit);
    } else if (!hasSearch && !hasPriceFilter) {
      const allDormIds = await prisma.dormitory.findMany({
        where: whereCondition,

        select: {
          id: true,

          images: {
            select: {
              id: true,
            },

            take: 1,
          },
        },
      });

      totalItems = allDormIds.length;
      const dormsWithImages = allDormIds.filter((d) => d.images.length > 0);
      const dormsWithoutImages = allDormIds.filter(
        (d) => d.images.length === 0,
      );
      shuffleArray(dormsWithImages);
      shuffleArray(dormsWithoutImages);
      const sortedIds = [...dormsWithImages, ...dormsWithoutImages].map(
        (d) => d.id,
      );
      const pageIds = sortedIds.slice(skip, skip + limit);

      if (pageIds.length > 0) {
        const fetchedDorms = await prisma.dormitory.findMany({
          where: {
            id: {
              in: pageIds,
            },
          },

          include: dormIncludeQuery,
        });

        resultDorms = pageIds
          .map((id) => fetchedDorms.find((d) => d.id === id))
          .filter(Boolean);
      }
    } else {
      const availableDorms = await prisma.dormitory.findMany({
        where: {
          ...whereCondition,

          rooms: {
            some: {
              status: "AVAILABLE",
              deletedAt: null,
            },
          },
        },

        select: {
          id: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      const fullDorms = await prisma.dormitory.findMany({
        where: {
          ...whereCondition,

          NOT: {
            rooms: {
              some: {
                status: "AVAILABLE",
                deletedAt: null,
              },
            },
          },
        },

        select: {
          id: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

      const sortedIds = [...availableDorms, ...fullDorms].map((d) => d.id);
      totalItems = sortedIds.length;
      const pageIds = sortedIds.slice(skip, skip + limit);

      if (pageIds.length > 0) {
        const fetchedDorms = await prisma.dormitory.findMany({
          where: {
            id: {
              in: pageIds,
            },
          },

          include: dormIncludeQuery,
        });

        resultDorms = pageIds
          .map((id) => fetchedDorms.find((d) => d.id === id))
          .filter(Boolean);
      }
    }

    const finalData = await Promise.all(
      resultDorms.map(async (dorm: any) => {
        const imagesWithUrl = await Promise.all(
          dorm.images.map(async (img: any) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey),
          })),
        );

        let nearbyData = null;

        if (dorm._targetLandmark) {
          nearbyData = {
            name: dorm._targetLandmark.name,
            slug: dorm._targetLandmark.slug,
            distanceKm: Number(dorm._distance.toFixed(2)),
            distanceText: formatDistance(dorm._distance),
          };
        } else if (dorm.latitude && dorm.longitude) {
          const landmarks = await prisma.landmark.findMany({
            where: {
              status: "ACTIVE",
            },
          });

          let minDistance = Infinity;
          let nearest = null;

          for (const lm of landmarks) {
            if (!lm.latitude || !lm.longitude) continue;

            const dist = getDistance(
              dorm.latitude,
              dorm.longitude,
              lm.latitude,
              lm.longitude,
            );

            if (dist < minDistance) {
              minDistance = dist;
              nearest = lm;
            }
          }

          if (nearest) {
            nearbyData = {
              name: nearest.name,
              slug: nearest.slug,
              distanceKm: Number(minDistance.toFixed(2)),
              distanceText: formatDistance(minDistance),
            };
          }
        }

        let availabilityStatus: string | undefined = undefined;

        if (dorm.rooms && dorm.rooms.length > 0) {
          const hasAvailable = dorm.rooms.some(
            (r: any) => r.status === "AVAILABLE",
          );
          availabilityStatus = hasAvailable ? "AVAILABLE" : "FULL";
        }

        const { _distance, _targetLandmark, rooms, ...rest } = dorm;

        return {
          ...rest,
          images: imagesWithUrl,
          nearby: nearbyData,
          availabilityStatus,
        };
      }),
    );

    return {
      data: finalData,

      meta: {
        page: Number(page),
        limit: limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  },

  async getDormSlug(slug: string) {
    const dorm = await prisma.dormitory.findUnique({
      where: {
        slug: slug,
      },

      include: {
        settings: true,

        images: {
          where: {
            category: "DORMITORY",
          },

          orderBy: [
            {
              isCover: "desc",
            },
            {
              order: "asc",
            },
          ],
        },

        owner: true,

        rooms: {
          where: {
            deletedAt: null,
          },

          select: {
            status: true,
            type: true,
          },
        },
      },
    });

    if (!dorm) return null;

    const imagesWithUrls = await Promise.all(
      dorm.images.map(async (img) => {
        return {
          ...img,
          url: await generateSignedUrl(img.objectKey),
        };
      }),
    );

    let availableRoomsCount = 0;
    let availableAirRoomsCount = 0;
    let availableFanRoomsCount = 0;

    if (dorm.rooms && dorm.rooms.length > 0) {
      const availableRooms = dorm.rooms.filter((r) => r.status === "AVAILABLE");
      availableRoomsCount = availableRooms.length;
      availableAirRoomsCount = availableRooms.filter(
        (r) => r.type === "AIR",
      ).length;
      availableFanRoomsCount = availableRooms.filter(
        (r) => r.type === "FAN",
      ).length;
    }

    const { rooms, ...dormData } = dorm;

    return {
      ...dormData,
      images: imagesWithUrls,

      availability: {
        isAvailable: availableRoomsCount > 0,
        totalAvailable: availableRoomsCount,
        airAvailable: availableAirRoomsCount,
        fanAvailable: availableFanRoomsCount,
      },
    };
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

    await createActivityLog({
      userId: userId,
      action: "CREATE_DORM",
      entityType: "Dormitory",
      entityId: dorm.id,

      metadata: {
        dormName: name,
      },
    });

    return dorm;
  },

  async getDormImageById(imageId: string) {
    return await prisma.file.findUnique({
      where: {
        id: imageId,
      },
    });
  },

  async updateDormStatus(dormId: string, isPublished: boolean, userId: string) {
    if (!dormId) throw new Error("INVALID_DORM_ID");

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        status: true,

        ownerProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE" || !user.ownerProfile) {
      throw new Error("FORBIDDEN");
    }

    const dorm = await prisma.dormitory.findUnique({
      where: {
        id: dormId,
      },

      select: {
        id: true,
        ownerId: true,
        name: true,
      },
    });

    if (!dorm) throw new Error("NOT_FOUND");

    if (dorm.ownerId !== user.ownerProfile.id) throw new Error("FORBIDDEN");

    const updated = await prisma.dormitory.update({
      where: {
        id: dormId,
      },

      data: {
        isPublished,
      },

      select: {
        id: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    await createActivityLog({
      userId: userId,
      action: isPublished ? "PUBLISH_DORM" : "UNPUBLISH_DORM",
      entityType: "Dormitory",
      entityId: dormId,

      metadata: {
        dormName: dorm.name,
        isPublished,
      },
    });

    return updated;
  },

  async updateDorm(dorm: DormFormDataDto, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!ownerProfile) throw new Error("FORBIDDEN");

    const existingDorm = await prisma.dormitory.findUnique({
      where: {
        id: dorm.id,
      },
    });

    if (!existingDorm || existingDorm.ownerId !== ownerProfile.id) {
      throw new Error("FORBIDDEN");
    }

    const slug = generateSlug(dorm.name);
    const latLng = await getLatLngFromUrl(dorm.mapUrl ?? 0);
    const validPromptPayType =
      dorm.promptPayType &&
      ["PHONE", "ID_CARD", "E_WALLET"].includes(dorm.promptPayType)
        ? (dorm.promptPayType as any)
        : null;

    return await prisma.$transaction(async (tx) => {
      const updatedDorm = await tx.dormitory.update({
        where: {
          id: dorm.id,
        },

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
        where: {
          dormitoryId: dorm.id,
        },

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

      const paymentSetting = await tx.paymentSetting.upsert({
        where: {
          dormitoryId: dorm.id,
        },

        update: {
          bankName: dorm.bankName,
          bankAccount: dorm.bankAccount,
          bankHolder: dorm.bankHolder,
          promptPayType: validPromptPayType,
          promptPayValue: dorm.promptPayValue,
        },

        create: {
          dormitoryId: dorm.id,
          bankName: dorm.bankName,
          bankAccount: dorm.bankAccount,
          bankHolder: dorm.bankHolder,
          promptPayType: validPromptPayType,
          promptPayValue: dorm.promptPayValue,
          isActive: true,
        },
      });

      await createActivityLog({
        userId: userId,
        action: "UPDATE_DORM",
        entityType: "Dormitory",
        entityId: dorm.id,

        metadata: {
          dormName: dorm.name,
        },
      });

      return {
        ...updatedDorm,
        settings: setting,
        paymentSetting: paymentSetting,
      };
    });
  },

  async getOwnerDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!ownerProfile) return null;

    const dorm = await prisma.dormitory.findUnique({
      where: {
        id: dormId,
      },
    });

    if (!dorm) return null;

    if (dorm.ownerId !== ownerProfile.id) return null;

    return dorm;
  },

  async isOwnerOfDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!ownerProfile) return false;

    const dorm = await prisma.dormitory.findUnique({
      where: {
        id: dormId,
      },

      select: {
        ownerId: true,
      },
    });

    return dorm?.ownerId === ownerProfile.id;
  },

  async getDorms(user: UserDecodedDto) {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("UNAUTHORIZED");

    const dorms = await prisma.dormitory.findMany({
      where: {
        ownerId: owner.id,
      },

      include: {
        settings: true,

        images: {
          where: {
            category: FileCategory.DORMITORY,
          },

          orderBy: {
            order: "asc",
          },
        },

        owner: true,
        paymentSetting: true,
      },

      orderBy: [
        {
          isPublished: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    if (dorms.length === 0) return [];

    const dormsWithUrl = await Promise.all(
      dorms.map(async (dorm) => {
        const imagesWithUrl = await Promise.all(
          dorm.images.map(async (img) => ({
            ...img,
            url: await generateSignedUrl(img.objectKey),
          })),
        );

        return {
          ...dorm,
          images: imagesWithUrl,
        };
      }),
    );

    return dormsWithUrl;
  },

  async uploadDormImage(
    file: Buffer,
    dormId: string,
    objectKey: string,
    mimeType: string,
    size: number,
    userId: string,
  ) {
    const hasCover = await prisma.file.findFirst({
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
        isCover: true,
      },
    });

    const isCover = !hasCover;

    const lastImage = await prisma.file.findFirst({
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
      },

      orderBy: {
        order: "desc",
      },
    });

    const newOrder = (lastImage?.order ?? -1) + 1;

    const compressedFile = await sharp(file)
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        smartSubsample: true,
        effort: 5,
      })
      .toBuffer();

    const webpObjectKey = objectKey.replace(/\.[^/.]+$/, ".webp");
    await uploadFile(compressedFile, webpObjectKey, "image/webp");

    const newImage = await prisma.file.create({
      data: {
        dormitoryId: dormId,
        bucket: env.BUCKET,
        objectKey: webpObjectKey,
        mimeType: "image/webp",
        size: compressedFile.length,
        category: "DORMITORY",
        isCover,
        order: newOrder,
      },
    });

    if (userId) {
      await createActivityLog({
        userId: userId,
        action: "UPLOAD_DORM_IMAGE",
        entityType: "Dormitory",
        entityId: dormId,

        metadata: {
          fileId: newImage.id,
          isCover,
        },
      });
    }

    return newImage;
  },

  async deleteDormImage(imageId: string, userId: string) {
    const imageToDelete = await prisma.file.findUnique({
      where: {
        id: imageId,
      },
    });

    if (!imageToDelete) throw new Error("Image not found");

    try {
      await deleteFile(imageToDelete.objectKey);
    } catch (err: any) {
      if (err?.name !== "NoSuchKey" && err?.Code !== "NoSuchKey") throw err;
    }

    await prisma.file.delete({
      where: {
        id: imageId,
      },
    });

    if (imageToDelete.isCover) {
      const nextCoverCandidate = await prisma.file.findFirst({
        where: {
          dormitoryId: imageToDelete.dormitoryId,
          category: "DORMITORY",
        },

        orderBy: {
          order: "asc",
        },
      });

      if (nextCoverCandidate) {
        await prisma.file.update({
          where: {
            id: nextCoverCandidate.id,
          },

          data: {
            isCover: true,
          },
        });
      }
    }

    if (userId && imageToDelete.dormitoryId) {
      await createActivityLog({
        userId: userId,
        action: "DELETE_DORM_IMAGE",
        entityType: "Dormitory",
        entityId: imageToDelete.dormitoryId,

        metadata: {
          fileId: imageId,
        },
      });
    }

    return true;
  },

  async getDormImages(dormId: string) {
    const images = await prisma.file.findMany({
      where: {
        dormitoryId: dormId,
        category: "DORMITORY",
      },

      orderBy: [
        {
          isCover: "desc",
        },
        {
          order: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    const imagesWithUrl = await Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await generateSignedUrl(img.objectKey),
      })),
    );

    return imagesWithUrl;
  },

  async reorderDormImages(
    dormId: string,
    images: {
      id: string;
      order: number;
      isCover: boolean;
    }[],
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
        where: {
          id: img.id,
        },

        data: {
          order: img.order,
          isCover: img.isCover,
        },
      }),
    );

    await Promise.all(updatePromises);
    return true;
  },

  async getDashboard(
    dormId: string,
    userId: string,
    monthStr?: string,
    yearStr?: string,
  ) {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!owner) throw new Error("FORBIDDEN");

    if (dormId !== "ALL") {
      const dorm = await prisma.dormitory.findUnique({
        where: {
          id: dormId,
        },

        select: {
          id: true,
          ownerId: true,
        },
      });

      if (!dorm || dorm.ownerId !== owner.id) throw new Error("FORBIDDEN");
    }

    const baseBillWhere =
      dormId === "ALL"
        ? {
            room: {
              dormitory: {
                ownerId: owner.id,
              },
            },
          }
        : {
            room: {
              dormitoryId: dormId,
            },
          };

    const roomWhere =
      dormId === "ALL"
        ? {
            dormitory: {
              ownerId: owner.id,
            },
          }
        : {
            dormitoryId: dormId,
          };

    const maintenanceWhere =
      dormId === "ALL"
        ? {
            dormitory: {
              ownerId: owner.id,
            },
          }
        : {
            dormitoryId: dormId,
          };

    const now = new Date();
    const isAllYears = !yearStr || yearStr === "ALL";
    let graphData: any[] = [];

    if (isAllYears) {
      const currentYear = now.getFullYear();

      const oldestBill = await prisma.bill.findFirst({
        where: {
          ...baseBillWhere,
          status: "PAID",
        },

        orderBy: {
          billingMonth: "asc",
        },

        select: {
          billingMonth: true,
        },
      });

      const firstBillYear = oldestBill
        ? oldestBill.billingMonth.getFullYear()
        : currentYear;
      const startYear = Math.min(currentYear - 4, firstBillYear);
      const yearMap: Record<string, number> = {};

      for (let y = startYear; y <= currentYear; y++) yearMap[y.toString()] = 0;

      const bills = await prisma.bill.findMany({
        where: {
          ...baseBillWhere,
          status: "PAID",

          billingMonth: {
            gte: new Date(startYear, 0, 1),
            lte: new Date(currentYear, 11, 31, 23, 59, 59),
          },
        },

        select: {
          total: true,
          billingMonth: true,
        },
      });

      bills.forEach((bill) => {
        const y = bill.billingMonth.getFullYear().toString();

        if (yearMap[y] !== undefined) yearMap[y] += bill.total;
      });

      graphData = Object.entries(yearMap)
        .map(([yearKey, total]) => ({
          name: `${parseInt(yearKey) + 543}`,
          total,
          isCurrent: yearKey === currentYear.toString(),
        }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else {
      const selectedYear = parseInt(yearStr!);
      const selectedMonthInt =
        monthStr && monthStr !== "ALL" ? parseInt(monthStr) : null;

      const thaiMonths = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];

      const shortYearThai = (selectedYear + 543).toString().slice(-2);

      const monthlyData = await Promise.all(
        Array.from(
          {
            length: 12,
          },
          (_, i) => {
            return prisma.bill
              .aggregate({
                where: {
                  ...baseBillWhere,
                  status: "PAID",

                  billingMonth: {
                    gte: new Date(selectedYear, i, 1),
                    lte: new Date(selectedYear, i + 1, 0, 23, 59, 59, 999),
                  },
                },

                _sum: {
                  total: true,
                },
              })
              .then((res) => res._sum.total || 0);
          },
        ),
      );

      graphData = monthlyData.map((total, index) => ({
        name: `${thaiMonths[index]} ${shortYearThai}`,
        total,
        isCurrent: selectedMonthInt
          ? index + 1 === selectedMonthInt
          : index === now.getMonth() && selectedYear === now.getFullYear(),
      }));
    }

    let dateFilterForStats: any = {};

    if (!isAllYears) {
      const year = parseInt(yearStr!);

      if (!monthStr || monthStr === "ALL") {
        dateFilterForStats = {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59),
        };
      } else {
        const month = parseInt(monthStr);

        dateFilterForStats = {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59),
        };
      }
    }

    const [
      totalRooms,
      occupiedRooms,
      availableRooms,
      billsPaid,
      billsPending,
      billsOverdue,
      billsWaiting,
      maintTotal,
      maintOpen,
      maintInProgress,
      maintCompleted,
    ] = await Promise.all([
      prisma.room.count({
        where: roomWhere,
      }),
      prisma.room.count({
        where: {
          ...roomWhere,
          status: "OCCUPIED",
        },
      }),
      prisma.room.count({
        where: {
          ...roomWhere,
          status: "AVAILABLE",
        },
      }),
      prisma.bill.aggregate({
        where: {
          ...baseBillWhere,
          status: "PAID",
          billingMonth: dateFilterForStats,
        },

        _sum: {
          total: true,
        },

        _count: true,
      }),
      prisma.bill.aggregate({
        where: {
          ...baseBillWhere,
          status: "PENDING",

          dueDate: {
            gte: now,
          },

          billingMonth: dateFilterForStats,
        },

        _sum: {
          total: true,
        },

        _count: true,
      }),
      prisma.bill.aggregate({
        where: {
          ...baseBillWhere,
          billingMonth: dateFilterForStats,

          OR: [
            {
              status: "OVERDUE",
            },
            {
              status: "PENDING",

              dueDate: {
                lt: now,
              },
            },
          ],
        },

        _sum: {
          total: true,
        },

        _count: true,
      }),
      prisma.bill.aggregate({
        where: {
          ...baseBillWhere,
          status: "WAITING_FOR_VERIFICATION",
          billingMonth: dateFilterForStats,
        },

        _sum: {
          total: true,
        },

        _count: true,
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceWhere,
          createdAt: dateFilterForStats,
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceWhere,
          status: "OPEN",
          createdAt: dateFilterForStats,
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceWhere,
          status: "IN_PROGRESS",
          createdAt: dateFilterForStats,
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceWhere,
          status: "COMPLETED",
          createdAt: dateFilterForStats,
        },
      }),
    ]);

    return {
      dormId,
      month: monthStr,
      year: yearStr,
      monthlyRevenue: graphData,

      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
      },

      bills: {
        paid: {
          count: billsPaid._count,
          amount: billsPaid._sum.total ?? 0,
        },

        pending: {
          count: billsPending._count,
          amount: billsPending._sum.total ?? 0,
        },

        overdue: {
          count: billsOverdue._count,
          amount: billsOverdue._sum.total ?? 0,
        },

        waiting: {
          count: billsWaiting._count,
          amount: billsWaiting._sum.total ?? 0,
        },
      },

      maintenance: {
        total: maintTotal,
        open: maintOpen,
        inProgress: maintInProgress,
        completed: maintCompleted,
      },
    };
  },

  async deleteDorm(dormId: string, userId: string) {
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!ownerProfile) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const dorm = await prisma.dormitory.findUnique({
      where: {
        id: dormId,
      },

      include: {
        _count: {
          select: {
            rooms: true,
          },
        },

        images: true,
      },
    });

    if (!dorm) throw new Error("NOT_FOUND");

    if (dorm.ownerId !== ownerProfile.id) throw new Error("FORBIDDEN");

    if (dorm._count.rooms > 0) throw new Error("DORM_NOT_EMPTY");

    if (dorm.images && dorm.images.length > 0) {
      const deletePromises = dorm.images.map((img) =>
        deleteFile(img.objectKey).catch((err) => {
          logger.error(`Failed to delete image ${img.objectKey} from R2:`, err);
        }),
      );

      await Promise.all(deletePromises);
    }

    const deletedDorm = await prisma.dormitory.delete({
      where: {
        id: dormId,
      },
    });

    await createActivityLog({
      userId: userId,
      action: "DELETE_DORM",
      entityType: "Dormitory",
      entityId: dormId,

      metadata: {
        dormName: deletedDorm.name,
      },
    });

    return deletedDorm;
  },
};
