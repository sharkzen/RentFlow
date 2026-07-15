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

    // ==========================================
    // Routes เดิมจัดการห้องพัก
    // ==========================================
    routeRoles.get("/:dormId/rooms", RoomController.getRooms);
    routeRoles.post("/bulk", RoomController.createBulk);
    routeRoles.get("/:dormId", RoomController.getRoom);
    routeRoles.patch("/:roomId", RoomController.updateRoom);
    routeRoles.delete("/:roomId", RoomController.deleteRoom);

    // ==========================================
    // Routes ใหม่สำหรับจัดการ QR Code (Owner)
    // ==========================================

    // 1. สร้าง QR Code ใหม่ หรือ รีเซ็ต Token (Upsert)
    routeRoles.post("/:roomId/qr-auth", RoomController.createOrRenewQr);

    // 2. เปิด/ปิด สถานะการเข้าระบบด้วย QR Code
    routeRoles.patch("/:roomId/qr-auth/status", RoomController.toggleQrStatus);

    // 3. สร้าง PDF สำหรับสแกน QR Code หลายห้อง (Bulk PDF)
    routeRoles.post("/qr-auth/bulk-pdf", RoomController.generateBulkPdf);
  });
}
