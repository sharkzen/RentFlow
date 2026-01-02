import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { Prisma } from "@prisma/client";

interface GetRoomParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const roomService = {
  async getRoom(user: UserDecodedDto, dormId: string, params: GetRoomParams) {
    const { search, status, type, page = 1, limit = 10 } = params; // ตั้งค่า Default

    const skip = (page - 1) * limit;

    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: user.sub },
    });
    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const where: Prisma.RoomWhereInput = {
      dormitory: {
        id: dormId,
        ownerId: owner.id,
      },
    };

    if (search) {
      where.OR = [{ roomNumber: { contains: search } }];
    }
    if (status && status !== "ALL") {
      where.status = status as any;
    }
    if (type && type !== "ALL") {
      where.type = type as any;
    }

    const [total, rooms] = await prisma.$transaction([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        take: Number(limit),
        skip: Number(skip),
        orderBy: { roomNumber: "asc" },
      }),
    ]);

    return {
      data: rooms,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
