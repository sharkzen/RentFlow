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
  signResetSessionToken,
  verifyRefreshToken,
  verifyResetSessionToken,
} from "@/utils/jwt";

import { generateSlug } from "@/lib/text";
import { generateNumericOtp } from "@/utils/otp";
import logger from "@/utils/logger";
import { sendEmailImmediate } from "@/services/mail-sender";
import { EmailType } from "@/queues/email.types";
import * as argon2 from "argon2";
import { env } from "@/config/env";
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000;

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
    let latLng = null;
    const coordinateRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    const isCoordinate = data.mapUrl.match(coordinateRegex);

    if (isCoordinate) {
      latLng = {
        lat: parseFloat(isCoordinate[1]),
        lng: parseFloat(isCoordinate[3]),
      };
    } else {
      latLng = await getLatLngFromUrl(data.mapUrl);
    }

    if (!latLng) throw new Error("INVALID_MAP_URL_OR_COORDINATE");

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

    const now = new Date();

    if (user.lockedUntil && user.lockedUntil > now) {
      const err = new Error("ACCOUNT_LOCKED");
      (err as any).lockedUntil = user.lockedUntil;
      throw err;
    }

    const priorFailedAttempts = user.lockedUntil ? 0 : user.failedLoginAttempts;
    const isValid = await verifyPassword(user.password, data.password);

    if (!isValid) {
      const attempts = priorFailedAttempts + 1;

      if (attempts >= LOGIN_MAX_ATTEMPTS) {
        const lockedUntil = new Date(now.getTime() + LOGIN_LOCKOUT_MS);

        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            failedLoginAttempts: attempts,
            lockedUntil,
          },
        });

        const err = new Error("ACCOUNT_LOCKED");
        (err as any).lockedUntil = lockedUntil;
        throw err;
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          failedLoginAttempts: attempts,
          lockedUntil: null,
        },
      });

      throw new Error("INVALID_EMAIL_OR_PASSWORD");
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

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
      return {
        message: "OTP_SENT_IF_ACCOUNT_EXISTS",
      };
    }

    const otp = generateNumericOtp(6);
    const pepper = env.OTP_PEPPER_SECRET;
    const otpHash = await argon2.hash(otp + pepper);

    await prisma.$transaction([
      prisma.passwordResetOtp.deleteMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
      }),
      prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt: new Date(Date.now() + OTP_TTL_MS),
        },
      }),
    ]);

    try {
      await sendEmailImmediate({
        type: EmailType.RESET_PASSWORD,
        to: email,

        data: {
          otp,
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
      message: "OTP_SENT_IF_ACCOUNT_EXISTS",
    };
  },

  async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error("INVALID_OTP");
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        consumedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      throw new Error("OTP_NOT_FOUND_OR_EXPIRED");
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new Error("TOO_MANY_ATTEMPTS");
    }

    const pepper = env.OTP_PEPPER_SECRET;
    const isValid = await argon2.verify(record.otpHash, otp + pepper);

    if (!isValid) {
      const updated = await prisma.passwordResetOtp.update({
        where: {
          id: record.id,
        },

        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      if (updated.attempts >= OTP_MAX_ATTEMPTS) {
        throw new Error("TOO_MANY_ATTEMPTS");
      }

      throw new Error("INVALID_OTP");
    }

    await prisma.passwordResetOtp.update({
      where: {
        id: record.id,
      },

      data: {
        consumedAt: new Date(),
      },
    });

    const resetToken = signResetSessionToken({
      sub: user.id,
      purpose: "password_reset",
      otpId: record.id,
    });

    return {
      resetToken,
    };
  },

  async resetPassword(resetToken: string, newPassword: string) {
    const payload = verifyResetSessionToken(resetToken);

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        id: payload.otpId,
        userId: payload.sub,

        consumedAt: {
          not: null,
        },
      },
    });

    if (!record) {
      throw new Error("INVALID_OR_EXPIRED_TOKEN");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: {
        id: payload.sub,
      },

      data: {
        password: hashedPassword,
      },
    });

    await createActivityLog({
      userId: payload.sub,
      action: "RESET_PASSWORD_SUCCESS",
      entityType: "User",
      entityId: payload.sub,
    });

    return {
      message: "PASSWORD_RESET_SUCCESS",
    };
  },
};
