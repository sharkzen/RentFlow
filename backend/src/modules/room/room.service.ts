import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { Prisma } from "@prisma/client";
import { CreateBulkRoomsDto, RoomStatus } from "./dtos/room.dto";

interface GetRoomParams {
  search?: string;
  status?: string;
  floor?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const roomService = {
  async getRoom(user: UserDecodedDto, dormId: string, params: GetRoomParams) {
    const { search, status, type, floor, page = 1, limit = 10 } = params;

    const skip = (page - 1) * limit;

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const where: Prisma.RoomWhereInput = {
      dormitory: {
        id: dormId,
        ownerId: owner.id,
      },
    };

    if (search) {
      where.OR = [
        {
          roomNumber: {
            contains: search,
          },
        },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status as any;
    }

    if (type && type !== "ALL") {
      where.type = type as any;
    }

    if (floor) {
      const floorNum = Number(floor);

      if (!isNaN(floorNum)) {
        where.floor = floorNum;
      }
    }

    const [total, rooms] = await prisma.$transaction([
      prisma.room.count({
        where,
      }),
      prisma.room.findMany({
        where,
        take: Number(limit),
        skip: Number(skip),

        orderBy: [
          {
            floor: "asc",
          },
          {
            roomNumber: "asc",
          },
        ],
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

  async createBulkRooms(user: UserDecodedDto, payload: CreateBulkRoomsDto) {
    const { dormitoryId, rooms } = payload;

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const dormitory = await prisma.dormitory.findUnique({
      where: {
        id: dormitoryId,
        ownerId: owner.id,
      },
    });

    if (!dormitory) throw new Error("DORMITORY_NOT_FOUND");

    const existingRooms = await prisma.room.findMany({
      where: {
        dormitoryId,

        roomNumber: {
          in: rooms.map((r) => r.roomNumber),
        },
      },

      select: {
        roomNumber: true,
      },
    });

    const existingSet = new Set(existingRooms.map((r) => r.roomNumber));
    const processedSet = new Set<string>();
    const validRooms: Prisma.RoomCreateManyInput[] = [];
    const duplicatedRooms: string[] = [];

    for (const room of rooms) {
      if (
        existingSet.has(room.roomNumber) ||
        processedSet.has(room.roomNumber)
      ) {
        duplicatedRooms.push(room.roomNumber);
      } else {
        processedSet.add(room.roomNumber);

        validRooms.push({
          dormitoryId,
          floor: Number(room.floor),
          roomNumber: room.roomNumber,
          type: room.type,
          basePrice: room.basePrice,
          description: room.description ?? null,
          status: RoomStatus.AVAILABLE,
        });
      }
    }

    let createdCount = 0;

    if (validRooms.length > 0) {
      const result = await prisma.room.createMany({
        data: validRooms,
        skipDuplicates: true,
      });

      createdCount = result.count;
    }

    return {
      success: createdCount > 0,
      message:
        duplicatedRooms.length > 0
          ? "CREATE_PARTIAL_SUCCESS"
          : "CREATE_SUCCESS",
      createdCount,
      duplicatedRooms: Array.from(new Set(duplicatedRooms)),
    };
  },

  async updateRoom(
    user: UserDecodedDto,
    roomId: string,
    data: {
      roomNumber?: string;
      floor?: number;
      type?: "AIR" | "FAN";
      basePrice?: number;
      description?: string;
      status?: RoomStatus;
    },
  ) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },

      include: {
        dormitory: true,
      },
    });

    if (!room) throw new Error("ROOM_NOT_FOUND");

    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner || room.dormitory.ownerId !== owner.id) {
      throw new Error("FORBIDDEN_ACCESS");
    }

    if (data.status) {
      if (
        room.status === RoomStatus.OCCUPIED &&
        data.status !== RoomStatus.OCCUPIED
      ) {
        throw new Error("CANNOT_CHANGE_STATUS_OCCUPIED");
      }

      if (
        data.status === RoomStatus.OCCUPIED &&
        room.status !== RoomStatus.OCCUPIED
      ) {
        throw new Error("CANNOT_SET_STATUS_TO_OCCUPIED_MANUALLY");
      }
    }

    if (data.roomNumber && data.roomNumber !== room.roomNumber) {
      const duplicate = await prisma.room.findFirst({
        where: {
          dormitoryId: room.dormitoryId,
          roomNumber: data.roomNumber,

          id: {
            not: roomId,
          },
        },
      });

      if (duplicate) throw new Error("DUPLICATE_ROOM_NUMBER");
    }

    const updatedRoom = await prisma.room.update({
      where: {
        id: roomId,
      },

      data: {
        ...data,
        floor: data.floor ? Number(data.floor) : undefined,
      },
    });

    return updatedRoom;
  },
};
