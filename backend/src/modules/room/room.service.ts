import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { Prisma } from "@prisma/client";
import { CreateBulkRoomsDto, RoomStatus } from "./dto/room.dto";
import { createActivityLog } from "@/services/activity-log.service";
import crypto from "node:crypto";
import argon2 from "argon2";
import { createPdfFromHtml } from "../tenant/lib/tenant.lib";
import { buildBulkQrHtmlTemplate } from "./lib/room.lib";
import QRCode from "qrcode";
import { env } from "@/config/env";

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
        qrAuth: true,
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
        roomQrAuth: room.qrAuth,
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

  async generateBulkQrPdf(userId: string, roomIds: string[]) {
    const rooms = await prisma.room.findMany({
      where: {
        id: {
          in: roomIds,
        },

        dormitory: {
          owner: {
            userId: userId,
          },
        },
      },

      include: {
        dormitory: {
          include: {
            owner: true,
          },
        },

        tenants: {
          where: {
            isActive: true,
          },

          take: 1,
        },
      },

      orderBy: {
        roomNumber: "asc",
      },
    });

    if (rooms.length === 0) {
      throw new Error("ไม่พบข้อมูลห้องพัก หรือคุณไม่มีสิทธิ์เข้าถึง");
    }

    const pepper = env.QR_PEPPER_SECRET;

    if (!pepper) {
      throw new Error("QR_PEPPER_SECRET is not defined");
    }

    const qrDataList = [];

    for (const room of rooms) {
      if (room.status === "AVAILABLE" || room.tenants.length === 0) {
        continue;
      }

      const rawToken = crypto.randomBytes(32).toString("hex");

      const hashedToken = await argon2.hash(rawToken + pepper, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      await prisma.roomQrAuth.upsert({
        where: {
          roomId: room.id,
        },

        update: {
          token: hashedToken,
          isActive: true,
        },

        create: {
          roomId: room.id,
          token: hashedToken,
          isActive: true,
        },
      });

      const frontendUrl = env.FRONTEND_URL;

      if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not defined");
      }

      const scanUrl = `${frontendUrl}/auth/login?roomId=${room.id}&token=${rawToken}`;

      const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 400,

        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      const currentTenant = room.tenants[0];

      qrDataList.push({
        roomNumber: room.roomNumber,
        tenantName: `${currentTenant.firstName} ${currentTenant.lastName}`,
        dormName: room.dormitory.name,
        dormAddress: room.dormitory.address,
        dormPhone: room.dormitory.owner?.phone || "",
        qrCodeDataUrl,
      });
    }

    if (qrDataList.length === 0) {
      throw new Error(
        "ไม่มีห้องพักที่สามารถสร้าง QR Code ได้ (ต้องเป็นห้องที่มีผู้เช่า)",
      );
    }

    const publicPath = env.PUBLIC_PATH || process.cwd() + "/public";
    const htmlContent = buildBulkQrHtmlTemplate(qrDataList, publicPath);
    const pdfBuffer = await createPdfFromHtml(htmlContent);
    const firstRoom = qrDataList[0].roomNumber;
    let filename = "";

    if (qrDataList.length === 1) {
      filename = `QRCode_Room_${firstRoom}.pdf`;
    } else {
      const lastRoom = qrDataList[qrDataList.length - 1].roomNumber;
      filename = `QRCodes_${firstRoom}_to_${lastRoom}.pdf`;
    }

    return {
      pdfBuffer,
      filename,
    };
  },

  async toggleQrStatus(
    user: UserDecodedDto,
    roomId: string,
    isActive: boolean,
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

    const existingQr = await prisma.roomQrAuth.findUnique({
      where: {
        roomId: roomId,
      },
    });

    if (!existingQr) throw new Error("QR_AUTH_NOT_FOUND");

    const updatedQrAuth = await prisma.roomQrAuth.update({
      where: {
        roomId: roomId,
      },

      data: {
        isActive: isActive,
      },
    });

    await createActivityLog({
      userId: user.sub,
      action: "TOGGLE_QR_STATUS",
      entityType: "Room",
      entityId: roomId,

      metadata: {
        roomNumber: room.roomNumber,
        isActive,
      },
    });

    return updatedQrAuth;
  },

  async createOrRenewQr(user: UserDecodedDto, roomId: string) {
    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },

      include: {
        dormitory: {
          include: {
            owner: true,
          },
        },

        tenants: {
          where: {
            isActive: true,
          },

          take: 1,
        },
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

    if (room.status === "AVAILABLE" || room.tenants.length === 0) {
      throw new Error("CANNOT_CREATE_QR_FOR_AVAILABLE_ROOM");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const pepper = env.QR_PEPPER_SECRET;

    if (!pepper) {
      throw new Error("QR_PEPPER_SECRET is not defined");
    }

    const hashedToken = await argon2.hash(rawToken + pepper, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await prisma.roomQrAuth.upsert({
      where: {
        roomId: roomId,
      },

      update: {
        token: hashedToken,
        isActive: true,
      },

      create: {
        roomId: roomId,
        token: hashedToken,
        isActive: true,
      },
    });

    await createActivityLog({
      userId: user.sub,
      action: "CREATE_OR_RENEW_QR_CODE",
      entityType: "Room",
      entityId: roomId,

      metadata: {
        roomNumber: room.roomNumber,
      },
    });

    const frontendUrl = env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not defined");
    }

    const scanUrl = `${frontendUrl}/auth/login?roomId=${room.id}&token=${rawToken}`;

    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,

      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    const currentTenant = room.tenants[0];

    const qrDataList = [
      {
        roomNumber: room.roomNumber,
        tenantName: `${currentTenant.firstName} ${currentTenant.lastName}`,
        dormName: room.dormitory.name,
        dormAddress: room.dormitory.address,
        dormPhone: room.dormitory.owner?.phone || "",
        qrCodeDataUrl,
      },
    ];

    const publicPath = env.PUBLIC_PATH || process.cwd() + "/public";
    const htmlContent = buildBulkQrHtmlTemplate(qrDataList, publicPath);
    const pdfBuffer = await createPdfFromHtml(htmlContent);
    return pdfBuffer;
  },

  async getBulkQrData(
    user: UserDecodedDto,
    payload: {
      dormId: string;
      roomIds: string[];
    },
  ) {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    const dormitory = await prisma.dormitory.findUnique({
      where: {
        id: payload.dormId,
        ownerId: owner.id,
      },
    });

    if (!dormitory) throw new Error("DORMITORY_NOT_FOUND_OR_FORBIDDEN");

    const roomsWithQr = await prisma.room.findMany({
      where: {
        id: {
          in: payload.roomIds,
        },

        dormitoryId: payload.dormId,

        qrAuth: {
          isNot: null,
        },
      },

      select: {
        id: true,
        roomNumber: true,

        qrAuth: {
          select: {
            token: true,
            isActive: true,
          },
        },
      },

      orderBy: {
        roomNumber: "asc",
      },
    });

    return roomsWithQr;
  },
};
