import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { MaintenanceController } from "./maintenance.controller";
import { FastifyInstance } from "fastify";
import { Role } from "@/types/role.type";

export async function maintenanceRoute(app: FastifyInstance) {
  app.register(async (route) => {
    route.addHook("preHandler", authMiddleware);
    route.addHook("preHandler", authRoleMiddleware([Role.OWNER]));
    route.get("/", MaintenanceController.getMaintenance);
    route.patch("/:id/status", MaintenanceController.updateStatus);
  });
}
