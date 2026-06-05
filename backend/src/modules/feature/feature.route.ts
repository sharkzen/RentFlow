import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { featureController } from "@/modules/feature/feature.controller";

export async function featureRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER]),
    );
    routeRoles.get("/:key", featureController.getFeature);
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));
    routeRoles.get("/all", featureController.getAllFeatures);
    routeRoles.post("/", featureController.createFeature);
    routeRoles.patch("/:key", featureController.updateFeature);
    routeRoles.delete("/:key", featureController.deleteFeature);
  });
}
