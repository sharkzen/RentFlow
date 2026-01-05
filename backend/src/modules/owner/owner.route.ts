import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { OwnerController } from "./owner.controller";

export async function ownerRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.OWNER]));
    routeRoles.get("/", OwnerController.getOwnerInfo);
    routeRoles.patch("/", OwnerController.updateOwnerInfo);
  });
}
