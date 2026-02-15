import prisma from "@/lib/prisma";
import logger from "@/utils/logger";

interface ActivityLogInput {
  userId?: string | null;
  tenantId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
}

export async function createActivityLog(data: ActivityLogInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
      },
    });
  } catch (error: any) {
    logger.error(`Activity log error: ${error}`);
  }
}
