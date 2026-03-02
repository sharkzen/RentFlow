import prisma from "@/lib/prisma";

import {
  UserRole,
  OwnerStatus,
  MaintenanceStatus,
  Status,
  Prisma,
  FileCategory,
  LandmarkType,
} from "@prisma/client";

import { generateSignedUrl } from "@/services/r2Client";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { generateSlug } from "@/lib/text";
import { emailQueue } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";

export const AdminService = {
  getDashboardStats: async () => {
    const [
      totalUsers,
      totalOwners,
      totalTenants,
      pendingOwners,
      totalDormitories,
      pendingDormitories,
      totalRooms,
      openMaintenance,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: UserRole.OWNER,
        },
      }),
      prisma.user.count({
        where: {
          role: UserRole.TENANT,
        },
      }),
      prisma.ownerProfile.count({
        where: {
          status: OwnerStatus.PENDING,
        },
      }),
      prisma.dormitory.count(),
      prisma.dormitory.count({
        where: {
          OR: [
            {
              isPublished: false,
            },
            {
              status: Status.PENDING,
            },
          ],
        },
      }),
      prisma.room.count(),
      prisma.maintenanceRequest.count({
        where: {
          status: MaintenanceStatus.OPEN,
        },
      }),
      prisma.user.findMany({
        take: 5,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          status: true,
        },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalOwners,
        totalTenants,
        totalDormitories,
        totalRooms,
      },

      actionRequired: {
        pendingOwners,
        pendingDormitories,
        openMaintenance,
      },

      recentUsers,
    };
  },

  getPendingOwners: async (page: number, limit: number, search: string) => {
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.OwnerProfileWhereInput = {
      status: OwnerStatus.PENDING,

      OR: search
        ? [
            {
              fullName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              user: {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              dormitories: {
                some: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]
        : undefined,
    };

    const [total, items] = await prisma.$transaction([
      prisma.ownerProfile.count({
        where: whereCondition,
      }),
      prisma.ownerProfile.findMany({
        where: whereCondition,
        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          user: {
            select: {
              email: true,
              status: true,
              createdAt: true,
            },
          },

          dormitories: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,

              images: {
                where: {
                  category: FileCategory.DORMITORY,
                },

                take: 1,
              },
            },
          },
        },
      }),
    ]);

    const itemsWithUrls = await Promise.all(
      items.map(async (owner) => {
        const dormsWithUrls = await Promise.all(
          owner.dormitories.map(async (dorm) => {
            const images = await Promise.all(
              dorm.images.map(async (img) => ({
                ...img,
                objectKey: await generateSignedUrl(img.objectKey),
              })),
            );

            return {
              ...dorm,
              images,
            };
          }),
        );

        return {
          ...owner,
          dormitories: dormsWithUrls,
        };
      }),
    );

    return {
      data: itemsWithUrls,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  approveOwner: async (id: string) => {
    const approvedOwner = await prisma.$transaction(async (tx) => {
      const owner = await tx.ownerProfile.update({
        where: {
          id,
        },

        data: {
          status: OwnerStatus.APPROVED,
        },

        include: {
          user: true,
        },
      });

      await tx.user.update({
        where: {
          id: owner.userId,
        },

        data: {
          status: "ACTIVE",
        },
      });

      return owner;
    });

    await emailQueue.add(
      {
        type: EmailType.OWNER_APPROVED,
        to: approvedOwner.user.email,

        data: {
          ownerName: approvedOwner.fullName
            ? approvedOwner.fullName
            : "ผู้จัดการหอพัก",
          email: approvedOwner.user.email,
        },
      },
      {
        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    return approvedOwner;
  },

  rejectOwner: async (id: string) => {
    const rejectedOwner = await prisma.$transaction(async (tx) => {
      const owner = await tx.ownerProfile.update({
        where: {
          id,
        },

        data: {
          status: OwnerStatus.SUSPENDED,
        },

        include: {
          user: true,
        },
      });

      return owner;
    });

    await emailQueue.add(
      {
        type: EmailType.OWNER_REJECTED,
        to: rejectedOwner.user.email,

        data: {
          ownerName: rejectedOwner.fullName
            ? rejectedOwner.fullName
            : "ผู้สมัครหอพัก",
          email: rejectedOwner.user.email,
        },
      },
      {
        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    return rejectedOwner;
  },

  getDormitories: async (
    page: number,
    limit: number,
    search: string,
    status?: string,
    isPublished?: string,
  ) => {
    const skip = (page - 1) * limit;

    const where: Prisma.DormitoryWhereInput = {
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              owner: {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ]
        : undefined,

      status: status && status !== "ALL" ? (status as any) : undefined,
      isPublished:
        isPublished === "true"
          ? true
          : isPublished === "false"
            ? false
            : undefined,
    };

    const [total, items] = await prisma.$transaction([
      prisma.dormitory.count({
        where,
      }),
      prisma.dormitory.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          owner: {
            select: {
              fullName: true,
              phone: true,

              user: {
                select: {
                  email: true,
                },
              },
            },
          },

          images: {
            where: {
              isCover: true,
              category: FileCategory.DORMITORY,
            },

            take: 1,
          },

          _count: {
            select: {
              rooms: true,
            },
          },
        },
      }),
    ]);

    const itemsWithUrls = await Promise.all(
      items.map(async (dorm) => {
        const images = await Promise.all(
          dorm.images.map(async (img) => ({
            ...img,
            objectKey: await generateSignedUrl(img.objectKey),
          })),
        );

        return {
          ...dorm,
          images,
        };
      }),
    );

    return {
      data: itemsWithUrls,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getDormitoryDetail: async (id: string) => {
    const dorm = await prisma.dormitory.findUnique({
      where: {
        id,
      },

      include: {
        owner: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },

        images: {
          where: {
            category: FileCategory.DORMITORY,
          },

          orderBy: {
            order: "asc",
          },
        },

        settings: true,
        paymentSetting: true,

        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!dorm) return null;

    const imagesWithUrls = await Promise.all(
      dorm.images.map(async (img) => {
        try {
          const url = await generateSignedUrl(img.objectKey);

          return {
            ...img,
            url,
          };
        } catch (error) {
          console.error(`Error signing url for ${img.objectKey}:`, error);

          return {
            ...img,
            url: null,
          };
        }
      }),
    );

    return {
      ...dorm,
      images: imagesWithUrls,
    };
  },

  togglePublish: async (id: string, isPublished: boolean) => {
    return prisma.dormitory.update({
      where: {
        id,
      },

      data: {
        isPublished,
      },
    });
  },

  updateStatus: async (id: string, status: any) => {
    return prisma.dormitory.update({
      where: {
        id,
      },

      data: {
        status,
      },
    });
  },

  getOwnersList: async (
    page: number,
    limit: number,
    search: string,
    status?: string,
  ) => {
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = {
      role: UserRole.OWNER,

      OR: search
        ? [
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              ownerProfile: {
                fullName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
            {
              ownerProfile: {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ]
        : undefined,

      status: status && status !== "ALL" ? (status as Status) : undefined,
    };

    const [total, items] = await prisma.$transaction([
      prisma.user.count({
        where: whereCondition,
      }),
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,

          ownerProfile: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              status: true,

              _count: {
                select: {
                  dormitories: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: items,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getOwnerDetailById: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: UserRole.OWNER,
      },

      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,

        ownerProfile: {
          include: {
            dormitories: {
              select: {
                id: true,
                slug: true,
                name: true,
                address: true,
                status: true,
                isPublished: true,

                _count: {
                  select: {
                    rooms: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return user;
  },

  updateUserStatus: async (userId: string, status: Status) => {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          id: userId,
        },

        data: {
          status,
        },
      });

      if (status === Status.BANNED) {
        if (user.role === UserRole.OWNER) {
          await tx.ownerProfile.update({
            where: {
              userId,
            },

            data: {
              status: "SUSPENDED",
            },
          });
        }
      } else if (status === Status.ACTIVE) {
        if (user.role === UserRole.OWNER) {
          const profile = await tx.ownerProfile.findUnique({
            where: {
              userId,
            },
          });

          if (profile && profile.status === "SUSPENDED") {
            await tx.ownerProfile.update({
              where: {
                userId,
              },

              data: {
                status: "APPROVED",
              },
            });
          }
        }
      }

      return user;
    });
  },

  getLandmarks: async (
    page: number,
    limit: number,
    search: string,
    type?: string,
  ) => {
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.LandmarkWhereInput = {
      OR: search
        ? [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          ]
        : undefined,

      type: type && type !== "ALL" ? (type as LandmarkType) : undefined,
      status: Status.ACTIVE,
    };

    const [total, items] = await prisma.$transaction([
      prisma.landmark.count({
        where: whereCondition,
      }),
      prisma.landmark.findMany({
        where: whereCondition,
        skip,
        take: limit,

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return {
      data: items,

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  createLandmark: async (data: {
    name: string;
    type: LandmarkType;
    mapUrl: string;
  }) => {
    const coords = await getLatLngFromUrl(data.mapUrl);

    if (!coords) {
      throw new Error("INVALID_MAP_URL");
    }

    const slug = generateSlug(data.name);

    return prisma.landmark.create({
      data: {
        name: data.name,
        slug: slug,
        type: data.type,
        mapUrl: data.mapUrl,
        latitude: coords.lat,
        longitude: coords.lng,
        status: Status.ACTIVE,
      },
    });
  },

  updateLandmark: async (
    id: string,
    data: {
      name?: string;
      type?: LandmarkType;
      mapUrl?: string;
    },
  ) => {
    const updateData: any = {
      ...data,
    };

    if (data.mapUrl) {
      const coords = await getLatLngFromUrl(data.mapUrl);

      if (!coords) {
        throw new Error("INVALID_MAP_URL");
      }

      updateData.latitude = coords.lat;
      updateData.longitude = coords.lng;
    }

    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }

    return prisma.landmark.update({
      where: {
        id,
      },

      data: updateData,
    });
  },

  deleteLandmark: async (id: string) => {
    return prisma.landmark.delete({
      where: {
        id,
      },
    });
  },
};
