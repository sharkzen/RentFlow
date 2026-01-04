import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { DormController } from "./dorm.controller";

export async function dormRoute(app: FastifyInstance) {
  app.get("/all", DormController.getAllDorms);
  app.get("/:slug", DormController.getDormSlug);
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);

    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN])
    );

    routeRoles.post("/", DormController.createDorm);
    routeRoles.get("/", DormController.getDorms);
    routeRoles.get("/:dormId/overview", DormController.getDormOverview);
    routeRoles.put("/", DormController.updateDorms);

    routeRoles.patch("/:dormId/status", DormController.updateDormStatus);

    routeRoles.post("/:dormId/upload", DormController.uploadDormImage);

    routeRoles.delete("/image/:imageId", DormController.deleteDormImage);

    routeRoles.put("/:dormId/images/order", DormController.reorderDormImages);

    routeRoles.get("/:dormId/images", DormController.getDormImages);
  });
}
