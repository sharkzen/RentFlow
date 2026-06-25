import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { AnnouncementController } from "./announcement.controller";

export async function announcementRoute(app: FastifyInstance) {
  app.register(async (ownerRoutes) => {
    ownerRoutes.addHook("preHandler", authMiddleware);
    ownerRoutes.addHook("preHandler", authRoleMiddleware([Role.OWNER]));
    ownerRoutes.get("/owner", AnnouncementController.getOwnerAnnouncements);
    ownerRoutes.post("/", AnnouncementController.createAnnouncement);
    ownerRoutes.put("/:id", AnnouncementController.updateAnnouncement);
    ownerRoutes.delete("/:id", AnnouncementController.deleteAnnouncement);
    ownerRoutes.delete("/image/:imageId", AnnouncementController.deleteImage);
    ownerRoutes.patch("/:id/pin", AnnouncementController.togglePinAnnouncement);
    ownerRoutes.put("/reorder", AnnouncementController.reorderAnnouncements);
  });

  app.register(async (tenantRoutes) => {
    tenantRoutes.addHook("preHandler", authMiddleware);
    tenantRoutes.addHook("preHandler", authRoleMiddleware([Role.TENANT]));
    tenantRoutes.get("/tenant", AnnouncementController.getTenantAnnouncements);
    tenantRoutes.post("/tenant/:id/read", AnnouncementController.markAsRead);
  });
}
