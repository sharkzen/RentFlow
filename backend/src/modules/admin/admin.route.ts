import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { AdminController } from "./admin.controller";

export async function adminRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));
    routeRoles.get("/dashboard", AdminController.getDashboard);
    routeRoles.get("/approvals", AdminController.getPendingList);
    routeRoles.patch("/approvals/:id/approve", AdminController.approve);
    routeRoles.patch("/approvals/:id/reject", AdminController.reject);
    routeRoles.get("/dormitories", AdminController.getList);
    routeRoles.get("/dormitories/:id", AdminController.getDetail);
    routeRoles.patch("/dormitories/:id/publish", AdminController.togglePublish);
    routeRoles.patch("/dormitories/:id/status", AdminController.updateStatus);
    routeRoles.get("/users/owners", AdminController.getOwners);
    routeRoles.get("/users/owners/:id", AdminController.getOwnerById);
    routeRoles.patch("/users/:id/status", AdminController.updateUserStatus);
  });
}
