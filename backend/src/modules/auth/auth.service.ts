import prisma from "@/lib/prisma";
import {
  AdminRegisterDto,
  OwnerRegisterDto,
} from "@/modules/auth/dto/register.dto";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { hashPassword, verifyPassword } from "@/modules/auth/lib/password";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { createActivityLog } from "@/services/activity-log.service";
import {
  signAccessToken,
  signResetToken,
  verifyRefreshToken,
  verifyResetToken,
} from "@/utils/jwt";
import { generateSlug } from "@/lib/text";
import logger from "@/utils/logger";
import { sendEmailImmediate } from "@/utils/mail-sender";
import { EmailType } from "@/queues/email.types";
import * as argon2 from "argon2";
import { env } from "@/config/env";

export const authService = {
  async me(user: UserDecodedDto) {
    const userData = await prisma.user.findUnique({
      where: {
        id: user.sub,
      },

      include: {
        ownerProfile: true,

        tenantProfiles: {
          where: {
            isActive: true,
          },

          take: 1,

          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!userData) throw new Error("UNAUTHORIZED");

    let fullName = "";

    if (userData.role === "OWNER" && userData.ownerProfile) {
      fullName = userData.ownerProfile.fullName;
    } else if (
      userData.role === "TENANT" &&
      userData.tenantProfiles.length > 0
    ) {
      const profile = userData.tenantProfiles[0];
      fullName = `${profile.firstName} ${profile.lastName}`;
    } else if (userData.role === "ADMIN") {
      fullName = "Administrator";
    }

    return {
      ...userData,
      fullName: fullName || userData.email,
    };
  },

  async registerOwner(data: OwnerRegisterDto) {
    if (
      !data?.fullName ||
      !data?.dormName ||
      !data?.address ||
      !data?.mapUrl ||
      !data?.phone ||
      !data?.email ||
      !data?.password
    ) {
      throw new Error("DATA_ARE_NOT_VALID");
    }

    const existing = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

    const hashedPassword = await hashPassword(data.password);
    const latLng = await getLatLngFromUrl(data.mapUrl);

    if (!latLng) throw new Error("INVALID_MAP_URL");

    const result = await prisma.$transaction(async (prismaTx) => {
      const user = await prismaTx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: "OWNER",
        },
      });

      const ownerProfile = await prismaTx.ownerProfile.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          phone: data.phone,
          status: "PENDING",
        },
      });

      const slug = generateSlug(data.dormName);

      const dormitory = await prismaTx.dormitory.create({
        data: {
          ownerId: ownerProfile.id,
          name: data.dormName,
          address: data.address,
          mapUrl: data.mapUrl,
          latitude: latLng.lat,
          longitude: latLng.lng,
          slug,
        },
      });

      return {
        user,
        ownerProfile,
        dormitory,
      };
    });

    await createActivityLog({
      userId: result.user.id,
      action: "REGISTER_OWNER",
      entityType: "User",
      entityId: result.user.id,

      metadata: {
        dormName: data.dormName,
      },
    });

    return result;
  },

  async registerAdmin(data: AdminRegisterDto) {
    if (!data?.email || !data?.password) throw new Error("DATA_ARE_NOT_VALID");

    const existing = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    await createActivityLog({
      userId: user.id,
      action: "REGISTER_ADMIN",
      entityType: "User",
      entityId: user.id,
    });

    return user;
  },

  async login(data: LoginDto) {
    if (!data?.email || !data?.password) throw new Error("DATA_ARE_NOT_VALID");

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) throw new Error("EMAIL_NOT_FOUND");

    const isValid = await verifyPassword(user.password, data.password);

    if (!isValid) throw new Error("INVALID_EMAIL_OR_PASSWORD");

    await createActivityLog({
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    });

    return user;
  },

  async loginWithQr(data: { roomId: string; token: string }) {
    if (!data?.roomId || !data?.token) throw new Error("DATA_ARE_NOT_VALID");

    const roomQrAuth = await prisma.roomQrAuth.findUnique({
      where: {
        roomId: data.roomId,
      },

      include: {
        room: {
          include: {
            tenants: {
              where: {
                isActive: true,
                deletedAt: null,
              },

              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!roomQrAuth) throw new Error("INVALID_QR_TOKEN");

    if (!roomQrAuth.isActive) throw new Error("QR_NOT_ACTIVE");

    const pepper = env.QR_PEPPER_SECRET;

    if (!pepper) {
      throw new Error("QR_PEPPER_SECRET is not defined");
    }

    const tokenWithPepper = data.token + pepper;
    const isValidToken = await argon2.verify(roomQrAuth.token, tokenWithPepper);

    if (!isValidToken) {
      throw new Error("INVALID_QR_TOKEN");
    }

    const activeTenant = roomQrAuth.room.tenants[0];

    if (!activeTenant || !activeTenant.user) {
      throw new Error("USER_NOT_FOUND_FOR_ROOM");
    }

    const user = activeTenant.user;

    if (user.status !== "ACTIVE" && user.status !== "PENDING") {
      throw new Error("USER_ACCOUNT_SUSPENDED");
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        tenantId: activeTenant.id,
        action: "LOGIN_QR",
        entityType: "User",
        entityId: user.id,
      },
    });

    return user;
  },

  async refreshAccessToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
    });

    if (!user || user.status === "BANNED" || user.deletedAt) {
      throw new Error("UNAUTHORIZED");
    }

    return signAccessToken({
      sub: user.id,
      role: user.role,
    });
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const token = signResetToken({
      sub: user.id,
    });

    const frontendUrl = env.FRONTEND_URL;
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    logger.info({
      frontendUrl,
      resetLink,
    });

    try {
      await sendEmailImmediate({
        type: EmailType.RESET_PASSWORD,
        to: email,

        data: {
          link: resetLink,
        },
      });

      await createActivityLog({
        userId: user.id,
        action: "REQUEST_PASSWORD_RESET",
        entityType: "User",
        entityId: user.id,
      });
    } catch (error: any) {
      logger.error(error);
    }

    return {
      message: "RESET_LINK_SENT",
    };
  },

  async verifyTokenValidity(token: string) {
    try {
      verifyResetToken(token);

      return {
        valid: true,
      };
    } catch (error) {
      throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }
  },

  async resetPassword(token: string, newPassword: string) {
    const payload = verifyResetToken(token);
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: payload.sub,
      },

      data: {
        password: hashedPassword,
      },
    });

    logger.info("EMAIL JOB ADDED");

    await createActivityLog({
      userId: payload.sub as string,
      action: "RESET_PASSWORD_SUCCESS",
      entityType: "User",
      entityId: payload.sub as string,
    });

    return {
      message: "PASSWORD_RESET_SUCCESS",
    };
  },
};
