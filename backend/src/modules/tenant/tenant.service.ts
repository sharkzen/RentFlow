import prisma from "@/lib/prisma";

interface GetTenantDormParams {
  dormId: string;
  sub: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const tenantService = {
  getTenantDorm: async ({
    dormId,
    sub,
    page = 1,
    limit = 10,
    search,
  }: GetTenantDormParams) => {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: sub },
      select: { id: true },
    });

    if (!owner) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const where: any = {
      room: {
        dormitory: {
          id: dormId,
          ownerId: owner.id,
        },
      },
      deletedAt: null,
    };

    // 🔍 global search (ตรง schema จริง)
    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          room: {
            roomNumber: {
              contains: search,
              mode: "insensitive",
            },
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
      ];
    }

    const [items, total] = await Promise.all([
      prisma.tenantProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: search
          ? undefined
          : {
              room: {
                roomNumber: "asc",
              },
            },
        include: {
          room: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),

      prisma.tenantProfile.count({
        where,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
