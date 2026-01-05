import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { OwnerProfileDto } from "@/modules/owner/dtos/owner.dto";
import { UpdateOwnerDto } from "./validators/owner.validator";

export const OwnerService = {
  getOwnerProfile: async (user: UserDecodedDto): Promise<OwnerProfileDto> => {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: user.sub },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    return owner;
  },

  updateOwnerProfile: async (
    user: UserDecodedDto,
    data: UpdateOwnerDto
  ): Promise<OwnerProfileDto> => {
    try {
      const updatedOwner = await prisma.ownerProfile.update({
        where: { userId: user.sub },
        data: {
          ...data,
          facebook: data.facebook === "" ? null : data.facebook,
        },
      });

      return updatedOwner;
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new Error("OWNER_NOT_FOUND");
      }
      throw error;
    }
  },
};
