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
import logger from "@/utils/logger";
import { emailQueue, EMAIL_JOB_NAME } from "@/queues/email.queue";
import { EmailType } from "@/queues/email.types";
import { getBucketSize } from "@/services/r2Client";
import { formatBytes } from "@/utils/formatBytes";
import { createActivityLog } from "@/services/activity-log.service";
import { decrypt, maskIdCard } from "@/utils/encryption";
import { hashPassword } from "@/modules/auth/lib/password";

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
      r2Stats,
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
      getBucketSize(),
    ]);

    const dbSizeResult = await prisma.$queryRaw<{ total_size: bigint }[]>`
      SELECT SUM(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))::bigint as total_size
      FROM pg_tables
      WHERE schemaname = 'public';
    `;

    const dbSizeBytes = Number(dbSizeResult[0]?.total_size || 0);
    const r2SizeBytes = r2Stats.totalSizeBytes;
    const dbFormatted = formatBytes(dbSizeBytes);
    const r2Formatted = formatBytes(r2SizeBytes);
    const dbSizeGB = dbSizeBytes / (1024 * 1024 * 1024);
    let dbAiAdvice = "ฐานข้อมูลอยู่ในเกณฑ์ปกติ ไม่จำเป็นต้องจัดการเพิ่มเติม";
    let shouldOptimizeDb = false;

    if (dbSizeGB > 10) {
      dbAiAdvice =
        "AI แนะนำ: ความจุเกิน 10GB ควรทำการล้างตาราง Log หรือสลับข้อมูลเก่าไปยังชุดเก็บเอกสาร (Archive)";
      shouldOptimizeDb = true;
    } else if (dbSizeGB > 5) {
      dbAiAdvice =
        "AI แนะนำ: เริ่มมีปริมาณข้อมูลสูง ควรตรวจสอบดัชนี (Indexing) ประสิทธิภาพคิวรี";
      shouldOptimizeDb = true;
    }

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

      storage: {
        database: {
          displayValue: `${dbFormatted.value} ${dbFormatted.unit}`,
          aiAdvice: dbAiAdvice,
          shouldOptimize: shouldOptimizeDb,
        },

        r2: {
          displayValue: `${r2Formatted.value} ${r2Formatted.unit}`,
          totalFiles: r2Stats.totalFiles,
        },
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

  approveOwner: async (id: string, adminUserId: string) => {
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
      EMAIL_JOB_NAME,
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

    await createActivityLog({
      userId: adminUserId,
      action: "APPROVE_OWNER",
      entityType: "OwnerProfile",
      entityId: id,
    });

    return approvedOwner;
  },

  rejectOwner: async (id: string, adminUserId: string) => {
    const ownerToDelete = await prisma.ownerProfile.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
      },
    });

    if (!ownerToDelete) {
      throw new Error("ไม่พบข้อมูลผู้สมัครหอพักนี้");
    }

    const userEmail = ownerToDelete.user.email;
    const ownerName = ownerToDelete.fullName
      ? ownerToDelete.fullName
      : "ผู้สมัครหอพัก";
    const userId = ownerToDelete.userId;

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    await emailQueue.add(
      EMAIL_JOB_NAME,
      {
        type: EmailType.OWNER_REJECTED,
        to: userEmail,

        data: {
          ownerName: ownerName,
          email: userEmail,
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

    await createActivityLog({
      userId: adminUserId,
      action: "REJECT_OWNER",
      entityType: "OwnerProfile",
      entityId: id,

      metadata: {
        ownerName,
      },
    });

    return {
      success: true,
    };
  },

  getDormitories: async (
    page: number,
    limit: number,
    search: string,
    status?: string,
    isPublished?: string,
    isFeatured?: string,
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
      isFeatured:
        isFeatured === "true"
          ? true
          : isFeatured === "false"
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
              lineId: true,
              facebook: true,

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
        } catch (error: any) {
          logger.error(`Error signing url for ${img.objectKey}:`, error);

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

  togglePublish: async (
    id: string,
    isPublished: boolean,
    adminUserId: string,
  ) => {
    const result = await prisma.dormitory.update({
      where: {
        id,
      },

      data: {
        isPublished,
      },
    });

    await createActivityLog({
      userId: adminUserId,
      action: "TOGGLE_DORM_PUBLISH",
      entityType: "Dormitory",
      entityId: id,

      metadata: {
        isPublished,
      },
    });

    return result;
  },

  updateStatus: async (id: string, status: any, adminUserId: string) => {
    const result = await prisma.dormitory.update({
      where: {
        id,
      },

      data: {
        status,
      },
    });

    await createActivityLog({
      userId: adminUserId,
      action: "UPDATE_DORM_STATUS_ADMIN",
      entityType: "Dormitory",
      entityId: id,

      metadata: {
        status,
      },
    });

    return result;
  },

  toggleFeatured: async (
    id: string,
    isFeatured: boolean,
    adminUserId: string,
  ) => {
    let result;

    if (isFeatured) {
      const maxOrder = await prisma.dormitory.aggregate({
        where: {
          isFeatured: true,
        },

        _max: {
          featuredOrder: true,
        },
      });

      result = await prisma.dormitory.update({
        where: {
          id,
        },

        data: {
          isFeatured: true,
          featuredOrder: (maxOrder._max.featuredOrder ?? -1) + 1,
        },
      });
    } else {
      result = await prisma.dormitory.update({
        where: {
          id,
        },

        data: {
          isFeatured: false,
          featuredOrder: null,
        },
      });
    }

    await createActivityLog({
      userId: adminUserId,
      action: "TOGGLE_DORM_FEATURED",
      entityType: "Dormitory",
      entityId: id,

      metadata: {
        isFeatured,
      },
    });

    return result;
  },

  getFeaturedDormitories: async () => {
    const items = await prisma.dormitory.findMany({
      where: {
        isFeatured: true,
      },

      orderBy: {
        featuredOrder: "asc",
      },

      include: {
        owner: {
          select: {
            fullName: true,
          },
        },

        images: {
          where: {
            isCover: true,
            category: FileCategory.DORMITORY,
          },

          take: 1,
        },
      },
    });

    return Promise.all(
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
  },

  reorderFeatured: async (
    items: {
      id: string;
      order: number;
    }[],
    adminUserId: string,
  ) => {
    await prisma.$transaction(
      items.map((item) =>
        prisma.dormitory.update({
          where: {
            id: item.id,
          },

          data: {
            featuredOrder: item.order,
          },
        }),
      ),
    );

    await createActivityLog({
      userId: adminUserId,
      action: "REORDER_FEATURED_DORMS",
      entityType: "Dormitory",

      metadata: {
        count: items.length,
      },
    });

    return {
      success: true,
    };
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
              lineId: true,
              facebook: true,
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

  getUsersList: async (
    page: number,
    limit: number,
    search: string,
    role?: string,
    status?: string,
  ) => {
    const skip = (page - 1) * limit;

    const roleFilter =
      role === UserRole.OWNER || role === UserRole.TENANT
        ? role
        : { in: [UserRole.OWNER, UserRole.TENANT] };

    const tokens = search.trim().split(/\s+/).filter(Boolean);

    const whereCondition: Prisma.UserWhereInput = {
      role: roleFilter as Prisma.UserWhereInput["role"],
      deletedAt: null,
      status: status && status !== "ALL" ? (status as Status) : undefined,

      AND: tokens.map((token) => {
        const contains = { contains: token, mode: "insensitive" as const };

        return {
          OR: [
            { email: contains },
            { id: { startsWith: token.toLowerCase() } },
            { ownerProfile: { fullName: contains } },
            { ownerProfile: { phone: contains } },
            { ownerProfile: { lineId: contains } },
            { ownerProfile: { facebook: contains } },
            { tenantProfiles: { some: { firstName: contains } } },
            { tenantProfiles: { some: { lastName: contains } } },
            { tenantProfiles: { some: { email: contains } } },
            {
              tenantProfiles: {
                some: { room: { roomNumber: contains } },
              },
            },
            {
              tenantProfiles: {
                some: { room: { dormitory: { name: contains } } },
              },
            },
            {
              ownerProfile: { dormitories: { some: { name: contains } } },
            },
          ],
        };
      }),
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
          role: true,
          status: true,
          createdAt: true,
          lockedUntil: true,

          ownerProfile: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              lineId: true,
              facebook: true,
              status: true,

              _count: {
                select: {
                  dormitories: true,
                },
              },
            },
          },

          tenantProfiles: {
            where: {
              deletedAt: null,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,

              room: {
                select: {
                  roomNumber: true,
                  dormitory: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => ({
        ...item,
        tenantProfiles: item.tenantProfiles.map((t) => ({
          ...t,
          phone: decrypt(t.phone),
        })),
      })),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getUserDetailById: async (userId: string) => {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        role: {
          in: [UserRole.OWNER, UserRole.TENANT],
        },
        deletedAt: null,
      },

      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lockedUntil: true,
        failedLoginAttempts: true,

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

        tenantProfiles: {
          where: {
            deletedAt: null,
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            idCard: true,
            address: true,
            numberOfResidents: true,
            isActive: true,
            moveInDate: true,
            moveOutDate: true,
            contractStartDate: true,
            contractEndDate: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            createdAt: true,

            room: {
              select: {
                roomNumber: true,
                dormitory: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      tenantProfiles: user.tenantProfiles.map((t) => ({
        ...t,
        phone: decrypt(t.phone),
        idCard: maskIdCard(decrypt(t.idCard)),
        address: decrypt(t.address),
        emergencyContactName: decrypt(t.emergencyContactName),
        emergencyContactPhone: decrypt(t.emergencyContactPhone),
      })),
    };
  },

  changeUserPassword: async (
    userId: string,
    newPassword: string,
    adminUserId: string,
  ) => {
    const target = await prisma.user.findFirst({
      where: {
        id: userId,
        role: {
          in: [UserRole.OWNER, UserRole.TENANT],
        },
        deletedAt: null,
      },

      select: {
        id: true,
      },
    });

    if (!target) return null;

    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetOtp.deleteMany({
        where: {
          userId,
        },
      }),
    ]);

    await createActivityLog({
      userId: adminUserId,
      action: "ADMIN_CHANGE_PASSWORD",
      entityType: "User",
      entityId: userId,
    });

    return {
      success: true,
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

  updateUserStatus: async (
    userId: string,
    status: Status,
    adminUserId: string,
  ) => {
    const result = await prisma.$transaction(async (tx) => {
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

    await createActivityLog({
      userId: adminUserId,
      action: "UPDATE_USER_STATUS",
      entityType: "User",
      entityId: userId,

      metadata: {
        status,
      },
    });

    return result;
  },

  getLockedUsers: async (
    page: number,
    limit: number,
    search = "",
    role?: string,
  ) => {
    const skip = (page - 1) * limit;
    const tokens = search.trim().split(/\s+/).filter(Boolean);

    const whereCondition: Prisma.UserWhereInput = {
      lockedUntil: {
        gt: new Date(),
      },

      role:
        role === UserRole.OWNER ||
        role === UserRole.TENANT ||
        role === UserRole.ADMIN
          ? role
          : undefined,

      AND: tokens.map((token) => {
        const contains = { contains: token, mode: "insensitive" as const };

        return {
          OR: [
            { email: contains },
            { id: { startsWith: token.toLowerCase() } },
            { ownerProfile: { fullName: contains } },
            { ownerProfile: { phone: contains } },
            { tenantProfiles: { some: { firstName: contains } } },
            { tenantProfiles: { some: { lastName: contains } } },
          ],
        };
      }),
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
          lockedUntil: "asc",
        },

        select: {
          id: true,
          email: true,
          role: true,
          lockedUntil: true,
          failedLoginAttempts: true,
          createdAt: true,

          ownerProfile: {
            select: {
              fullName: true,
              phone: true,
            },
          },

          tenantProfiles: {
            where: {
              deletedAt: null,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => ({
        ...item,
        tenantProfiles: item.tenantProfiles.map((t) => ({
          ...t,
          phone: decrypt(t.phone),
        })),
      })),

      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  unlockUser: async (userId: string, adminUserId: string) => {
    const result = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await createActivityLog({
      userId: adminUserId,
      action: "UNLOCK_ACCOUNT",
      entityType: "User",
      entityId: userId,
    });

    return result;
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

  createLandmark: async (
    data: {
      name: string;
      type: LandmarkType;
      mapUrl: string;
    },
    adminUserId: string,
  ) => {
    const coords = await getLatLngFromUrl(data.mapUrl);

    if (!coords) {
      throw new Error("INVALID_MAP_URL");
    }

    const slug = generateSlug(data.name);

    const result = await prisma.landmark.create({
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

    await createActivityLog({
      userId: adminUserId,
      action: "CREATE_LANDMARK",
      entityType: "Landmark",
      entityId: result.id,

      metadata: {
        name: data.name,
      },
    });

    return result;
  },

  updateLandmark: async (
    id: string,
    data: {
      name?: string;
      type?: LandmarkType;
      mapUrl?: string;
    },
    adminUserId: string,
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

    const result = await prisma.landmark.update({
      where: {
        id,
      },

      data: updateData,
    });

    await createActivityLog({
      userId: adminUserId,
      action: "UPDATE_LANDMARK",
      entityType: "Landmark",
      entityId: id,
    });

    return result;
  },

  deleteLandmark: async (id: string, adminUserId: string) => {
    const result = await prisma.landmark.delete({
      where: {
        id,
      },
    });

    await createActivityLog({
      userId: adminUserId,
      action: "DELETE_LANDMARK",
      entityType: "Landmark",
      entityId: id,
    });

    return result;
  },
};
