import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { Prisma } from "@prisma/client";
import { CreateBulkRoomsDto, RoomStatus } from "./dtos/room.dto";
import { createActivityLog } from "@/services/activity-log.service";

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

    const dormitoryCondition: Prisma.DormitoryWhereInput = {
      ownerId: owner.id,
    };

    if (dormId !== "ALL") {
      dormitoryCondition.id = dormId;
    }

    const where: Prisma.RoomWhereInput = {
      dormitory: dormitoryCondition,
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

      if (!isNaN(floorNum) && floor !== "") {
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

        include: {
          dormitory: {
            select: {
              name: true,
            },
          },

          tenants: true,
          meterSetting: true,
        },

        orderBy: [
          {
            dormitory: {
              name: "asc",
            },
          },
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
      await prisma.$transaction(async (tx) => {
        const result = await tx.room.createMany({
          data: validRooms,
          skipDuplicates: true,
        });

        createdCount = result.count;

        if (createdCount > 0) {
          const newlyCreatedRooms = await tx.room.findMany({
            where: {
              dormitoryId,

              roomNumber: {
                in: validRooms.map((r) => r.roomNumber),
              },
            },

            select: {
              id: true,
            },
          });

          const meterSettingsData = newlyCreatedRooms.map((room) => ({
            roomId: room.id,
            electricMeterDigits: 5,
            waterMeterDigits: null,
          }));

          await tx.roomMeterSetting.createMany({
            data: meterSettingsData,
            skipDuplicates: true,
          });
        }
      });

      await createActivityLog({
        userId: user.sub,
        action: "CREATE_BULK_ROOMS",
        entityType: "Dormitory",
        entityId: dormitoryId,

        metadata: {
          createdCount,
          failedCount: duplicatedRooms.length,
        },
      });
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
      electricMeterDigits?: number;
      waterMeterDigits?: number | null;
    },
  ) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },

      include: {
        dormitory: true,
        meterSetting: true,
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

    const { electricMeterDigits, waterMeterDigits, ...roomData } = data;

    const hasMeterSettingUpdate =
      electricMeterDigits !== undefined || waterMeterDigits !== undefined;

    const updatedRoom = await prisma.room.update({
      where: {
        id: roomId,
      },

      data: {
        ...roomData,
        floor:
          roomData.floor !== undefined ? Number(roomData.floor) : undefined,

        ...(hasMeterSettingUpdate && {
          meterSetting: {
            upsert: {
              create: {
                electricMeterDigits: electricMeterDigits ?? 5,
                waterMeterDigits: waterMeterDigits ?? null,
              },

              update: {
                ...(electricMeterDigits !== undefined && {
                  electricMeterDigits,
                }),

                ...(waterMeterDigits !== undefined && {
                  waterMeterDigits,
                }),
              },
            },
          },
        }),
      },

      include: {
        meterSetting: true,
      },
    });

    await createActivityLog({
      userId: user.sub,
      action: "UPDATE_ROOM",
      entityType: "Room",
      entityId: roomId,

      metadata: {
        roomNumber: updatedRoom.roomNumber,
        changes: data,
      },
    });

    return updatedRoom;
  },

  async getRooms(user: UserDecodedDto, dormId: string, status?: RoomStatus) {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const dormSettings = await prisma.dormitorySetting.findUnique({
      where: {
        dormitoryId: dormId,
      },
    });

    const whereCondition: Prisma.RoomWhereInput = {
      dormitoryId: dormId,

      dormitory: {
        ownerId: owner.id,
      },

      ...(status
        ? {
            status: status,
          }
        : {}),
    };

    const rooms = await prisma.room.findMany({
      where: whereCondition,

      include: {
        tenants: {
          where: {
            isActive: true,
          },

          take: 1,
        },

        bills: {
          orderBy: {
            billingMonth: "desc",
          },

          take: 1,

          where: {
            status: {
              not: "CANCELLED",
            },
          },
        },

        meterSetting: true,
      },

      orderBy: [
        {
          floor: "asc",
        },
        {
          roomNumber: "asc",
        },
      ],
    });

    return rooms.map((room) => {
      const currentTenant = room.tenants[0];
      const lastBill = room.bills[0];

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        type: room.type,
        basePrice: room.basePrice,
        status: room.status,
        tenantName: currentTenant
          ? `${currentTenant.firstName} ${currentTenant.lastName}`
          : null,
        tenantId: currentTenant?.id || null,
        lastWaterUnit: lastBill?.currentWaterUnitSnapshot ?? 0,
        lastElectricUnit: lastBill?.currentElectricUnitSnapshot ?? 0,
        hasLastBill: !!lastBill,
        commonFee: dormSettings?.commonFee ?? 0,
        waterMeterDigits: room.meterSetting?.waterMeterDigits || null,
        electricMeterDigits: room.meterSetting?.electricMeterDigits || null,
      };
    });
  },

  async deleteRoom(user: UserDecodedDto, roomId: string) {
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

    if (room.status === RoomStatus.OCCUPIED) {
      throw new Error("CANNOT_DELETE_OCCUPIED_ROOM");
    }

    await prisma.room.delete({
      where: {
        id: roomId,
      },
    });

    await createActivityLog({
      userId: user.sub,
      action: "DELETE_ROOM",
      entityType: "Room",
      entityId: roomId,

      metadata: {
        roomNumber: room.roomNumber,
      },
    });

    return {
      success: true,
      message: "Room deleted successfully",
    };
  },
};
