import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/modules/auth/lib/password";
import { RoomStatus, UserRole, Status } from "@prisma/client";
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
      where: {
        userId: sub,
      },

      select: {
        id: true,
      },
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
  createTenant: async (userId: string, data: any) => {
    // 1. เช็คว่าเป็น Owner จริงไหม
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) throw new Error("OWNER_PROFILE_NOT_FOUND");

    // 2. เช็คว่าห้องว่างจริงไหม และเป็นของ Owner คนนี้ไหม
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { dormitory: true },
    });

    if (!room) throw new Error("ROOM_NOT_FOUND");
    if (room.dormitory.ownerId !== owner.id) throw new Error("DORM_NOT_OWNED");
    if (room.status !== RoomStatus.AVAILABLE)
      throw new Error("ROOM_NOT_AVAILABLE");

    // 3. เช็ค Email ซ้ำ
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new Error("EMAIL_ALREADY_EXISTS");

    // 4. เตรียม Password (เปลี่ยนมาใช้ hashPassword ของ Argon2)
    // ถ้าไม่ได้ส่ง password มา ให้ใช้เบอร์โทร หรือ default 12345678
    const rawPassword = data.password || data.phone || "12345678";

    // *** เรียกใช้ function hashPassword ที่คุณ import มา ***
    const hashedPassword = await hashPassword(rawPassword);

    // 5. เริ่ม Transaction
    return await prisma.$transaction(async (tx) => {
      // 5.1 สร้าง User Account
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword, // เก็บ Argon2 hash
          role: UserRole.TENANT, // ใช้ Enum UserRole ตาม schema
          status: Status.ACTIVE, // ใช้ Enum Status ตาม schema
        },
      });

      // 5.2 สร้าง Tenant Profile
      const newTenant = await tx.tenantProfile.create({
        data: {
          userId: newUser.id,
          roomId: data.roomId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          idCard: data.idCard,
          email: data.email,

          // Snapshot ข้อมูล
          roomPriceSnapshot: room.basePrice,
          tenantNameSnapshot: `${data.firstName} ${data.lastName}`,

          moveInDate: data.moveInDate ? new Date(data.moveInDate) : new Date(),

          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          notes: data.notes,
        },
      });

      // 5.3 อัปเดตสถานะห้องเป็น ไม่ว่าง (OCCUPIED)
      await tx.room.update({
        where: { id: data.roomId },
        data: { status: RoomStatus.OCCUPIED },
      });

      return newTenant;
    });
  },
};
