import prisma from "@/lib/prisma";
import {
  AdminRegisterDto,
  OwnerRegisterDto,
} from "@/modules/auth/dto/register.dto";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { getLatLngFromUrl } from "@/lib/extractLatLng";
import { hashPassword, verifyPassword } from "@/modules/auth/lib/password";
import { LoginDto } from "@/modules/auth/dto/login.dto";
import { signAccessToken, verifyRefreshToken } from "@/utils/jwt";
import { generateSlug } from "@/lib/text";

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

    return user;
  },

  async login(data: LoginDto) {
    if (!data?.email || !data?.password) throw new Error("DATA_ARE_NOT_VALID");

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) throw new Error("INVALID_EMAIL_OR_PASSWORD");

    const isValid = await verifyPassword(user.password, data.password);

    if (!isValid) throw new Error("INVALID_EMAIL_OR_PASSWORD");

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
};
