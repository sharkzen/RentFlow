import prisma from "@/lib/prisma";
import { UserDecodedDto } from "../auth/dto/user.dto";
import { minioClient, generateSignedUrl } from "@/services/minio";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/config/env";
import {
  DormFormDataDto,
  GetDormsQueryDto,
} from "@/modules/dormitory/dtos/dorm.dto";
import { generateSlug } from "@/lib/text";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { formatDistance, getDistance } from "@/utils/geo";
import { Prisma, Status } from "@prisma/client";
import { shuffleArray } from "./lib/dorm.lib";
import logger from "@/utils/logger";

export const dormService = {
  async getAllDorms(query: GetDormsQueryDto) {
    const { search, minPrice, maxPrice, landmarkId, page = 1 } = query;

    const limit = 15;
    const skip = (Number(page) - 1) * limit;

    const whereCondition: Prisma.DormitoryWhereInput = {
      status: Status.ACTIVE,
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

    if (cleanLandmarkId) {
      const targetLandmark = await prisma.landmark.findUnique({
        where: {
          id: cleanLandmarkId,
        },
      });

      if (!targetLandmark)
        return {
          data: [],

          meta: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
          },
        };

      const allMatchingDorms = await prisma.dormitory.findMany({
        where: whereCondition,

        include: {
          images: true,
          settings: true,
        },
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

      dormsWithDistance.sort((a, b) => a._distance - b._distance);
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

          include: {
            images: true,
            settings: true,
          },
        });

        resultDorms = pageIds
          .map((id) => fetchedDorms.find((d) => d.id === id))
          .filter(Boolean);
      }
    } else {
      totalItems = await prisma.dormitory.count({
        where: whereCondition,
      });

      resultDorms = await prisma.dormitory.findMany({
        where: whereCondition,

        include: {
          images: true,
          settings: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        skip: skip,
        take: limit,
      });
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
        const hasValidLocation = dorm.latitude && dorm.longitude;

        if (dorm._targetLandmark) {
          nearbyData = {
            name: dorm._targetLandmark.name,
            slug: dorm._targetLandmark.slug,
            distanceKm: Number(dorm._distance.toFixed(2)),
            distanceText: formatDistance(dorm._distance),
          };
        } else {
          if (hasValidLocation) {
            const landmarks = await prisma.landmark.findMany({
              where: {
                status: Status.ACTIVE,
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
        }

        const { _distance, _targetLandmark, ...rest } = dorm;

        return {
          ...rest,
          images: imagesWithUrl,
          nearby: nearbyData,
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

    return {
      ...dorm,
      images: imagesWithUrls,
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
    if (!dormId) {
      throw new Error("INVALID_DORM_ID");
    }

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

    if (!user || user.status !== "ACTIVE") {
      throw new Error("FORBIDDEN");
    }

    if (!user.ownerProfile) {
      throw new Error("FORBIDDEN");
    }

    const dorm = await prisma.dormitory.findUnique({
      where: {
        id: dormId,
      },

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

      return {
        ...updatedDorm,
        settings: setting,
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
        images: true,
        owner: true,
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

    const command = new PutObjectCommand({
      Bucket: env.BUCKET,
      Key: objectKey,
      Body: file,
      ContentType: mimeType,
    });

    await minioClient.send(command);

    return prisma.file.create({
      data: {
        dormitoryId: dormId,
        bucket: env.BUCKET,
        objectKey,
        mimeType,
        size,
        category: "DORMITORY",
        isCover,
        order: newOrder,
      },
    });
  },

  async deleteDormImage(imageId: string) {
    const imageToDelete = await prisma.file.findUnique({
      where: {
        id: imageId,
      },
    });

    if (!imageToDelete) throw new Error("Image not found");

    try {
      await minioClient.send(
        new DeleteObjectCommand({
          Bucket: env.BUCKET,
          Key: imageToDelete.objectKey,
        }),
      );
    } catch (err: any) {
      if (err?.name !== "NoSuchKey" && err?.Code !== "NoSuchKey") {
        throw err;
      }
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

    let graphData: {
      name: string;
      total: number;
      isCurrent?: boolean;
    }[] = [];

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

      for (let y = startYear; y <= currentYear; y++) {
        yearMap[y.toString()] = 0;
      }

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

        if (yearMap[y] !== undefined) {
          yearMap[y] += bill.total;
        }
      });

      graphData = Object.entries(yearMap)
        .map(([yearKey, total]) => {
          const buddhistYear = parseInt(yearKey) + 543;

          return {
            name: `${buddhistYear}`,
            total,
            isCurrent: yearKey === currentYear.toString(),
          };
        })
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
            const mStart = new Date(selectedYear, i, 1);
            const mEnd = new Date(selectedYear, i + 1, 0, 23, 59, 59, 999);

            return prisma.bill
              .aggregate({
                where: {
                  ...baseBillWhere,
                  status: "PAID",

                  billingMonth: {
                    gte: mStart,
                    lte: mEnd,
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

      graphData = monthlyData.map((total, index) => {
        const monthIndex = index + 1;
        const label = `${thaiMonths[index]} ${shortYearThai}`;

        return {
          name: label,
          total: total,
          isCurrent: selectedMonthInt
            ? monthIndex === selectedMonthInt
            : index === now.getMonth() && selectedYear === now.getFullYear(),
        };
      });
    }

    let dateFilterForStats: any = {};

    if (isAllYears) {
      dateFilterForStats = {};
    } else {
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
        minioClient
          .send(
            new DeleteObjectCommand({
              Bucket: env.BUCKET,
              Key: img.objectKey,
            }),
          )
          .catch((err) => {
            logger.error(
              `Failed to delete image ${img.objectKey} from MinIO:`,
              err,
            );
          }),
      );

      await Promise.all(deletePromises);
    }

    return await prisma.dormitory.delete({
      where: {
        id: dormId,
      },
    });
  },
};
