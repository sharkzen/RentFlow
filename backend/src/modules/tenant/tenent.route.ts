import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { TenantController } from "@/modules/tenant/tenant.controller";

export async function tenantRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER, Role.TENANT]),
    );
    routeRoles.get("/:dormId", TenantController.getTenantDorm);
  });
}
