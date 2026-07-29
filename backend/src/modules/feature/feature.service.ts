import prisma from "@/lib/prisma";
import { createActivityLog } from "@/services/activity-log.service";

export const FeatureService = {
  getAllFeatures: async () => {
    try {
      const features = await prisma.feature.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        data: features,
      };
    } catch (error: any) {
      throw new Error("FAILED_TO_GET_FEATURES");
    }
  },

  getFeature: async (key: string) => {
    try {
      const feature = await prisma.feature.findUnique({
        where: {
          key,
        },
      });

      if (!feature)
        return {
          success: false,
          message: "FEATURE_NOT_FOUND",
        };

      return {
        success: true,
        data: feature,
      };
    } catch (error: any) {
      throw new Error("FAILED_TO_GET_FEATURE");
    }
  },

  createFeature: async (
    data: {
      key: string;
      name: string;
      description?: string;
      enabled?: boolean;
    },
    adminUserId: string,
  ) => {
    try {
      const existingFeature = await prisma.feature.findUnique({
        where: {
          key: data.key,
        },
      });

      if (existingFeature) throw new Error("FEATURE_ALREADY_EXISTS");

      const feature = await prisma.feature.create({
        data: {
          key: data.key,
          name: data.name,
          description: data.description,
          enabled: data.enabled ?? false,
        },
      });

      await createActivityLog({
        userId: adminUserId,
        action: "CREATE_FEATURE",
        entityType: "Feature",
        entityId: feature.id,

        metadata: {
          key: feature.key,
        },
      });

      return {
        success: true,
        data: feature,
      };
    } catch (error: any) {
      throw new Error(error.message || "FAILED_TO_CREATE_FEATURE");
    }
  },

  updateFeature: async (
    key: string,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
    },
    adminUserId: string,
  ) => {
    try {
      const feature = await prisma.feature.update({
        where: {
          key,
        },

        data: {
          ...data,
        },
      });

      await createActivityLog({
        userId: adminUserId,
        action: "UPDATE_FEATURE",
        entityType: "Feature",
        entityId: feature.id,
        metadata: data,
      });

      return {
        success: true,
        data: feature,
      };
    } catch (error: any) {
      throw new Error("FAILED_TO_UPDATE_FEATURE");
    }
  },

  deleteFeature: async (key: string, adminUserId: string) => {
    try {
      const feature = await prisma.feature.delete({
        where: {
          key,
        },
      });

      await createActivityLog({
        userId: adminUserId,
        action: "DELETE_FEATURE",
        entityType: "Feature",
        entityId: feature.id,

        metadata: {
          key,
        },
      });

      return {
        success: true,
        message: "FEATURE_DELETED_SUCCESSFULLY",
      };
    } catch (error: any) {
      throw new Error("FAILED_TO_DELETE_FEATURE");
    }
  },
};
