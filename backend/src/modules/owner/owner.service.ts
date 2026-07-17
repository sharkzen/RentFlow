import prisma from "@/lib/prisma";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { OwnerProfileDto } from "@/modules/owner/dto/owner.dto";
import { UpdateOwnerDto } from "./validators/owner.validator";
import { createActivityLog } from "@/services/activity-log.service";

export const OwnerService = {
  getOwnerProfile: async (user: UserDecodedDto): Promise<OwnerProfileDto> => {
    const owner = await prisma.ownerProfile.findUnique({
      where: {
        userId: user.sub,
      },
    });

    if (!owner) throw new Error("OWNER_NOT_FOUND");

    return owner;
  },

  updateOwnerProfile: async (
    user: UserDecodedDto,
    data: UpdateOwnerDto,
  ): Promise<OwnerProfileDto> => {
    try {
      const updatedOwner = await prisma.ownerProfile.update({
        where: {
          userId: user.sub,
        },

        data: {
          ...data,
          facebook: data.facebook === "" ? null : data.facebook,
        },
      });

      await createActivityLog({
        userId: user.sub,
        action: "UPDATE_OWNER_PROFILE",
        entityType: "OwnerProfile",
        entityId: updatedOwner.id,
        metadata: data,
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
