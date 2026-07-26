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
  logger.info(
    {
      userId: data.userId ?? null,
      tenantId: data.tenantId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
    },
    "activity_log",
  );
}
