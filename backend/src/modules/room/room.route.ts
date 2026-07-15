import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { RoomController } from "./room.controller";

export async function roomRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );
    routeRoles.post("/qr-auth/bulk-pdf", RoomController.generateBulkPdf);
    routeRoles.post("/:roomId/qr-auth", RoomController.createOrRenewQr);
    routeRoles.patch("/:roomId/qr-auth/status", RoomController.toggleQrStatus);
    routeRoles.get("/:dormId/rooms", RoomController.getRooms);
    routeRoles.post("/bulk", RoomController.createBulk);
    routeRoles.get("/:dormId", RoomController.getRoom);
    routeRoles.patch("/:roomId", RoomController.updateRoom);
    routeRoles.delete("/:roomId", RoomController.deleteRoom);
  });
}
