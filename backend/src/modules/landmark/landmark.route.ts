import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { LandmarkController } from "@/modules/landmark/landmark.controller";

export async function landmarkRoute(app: FastifyInstance) {
  app.get("/", LandmarkController.getAllLandmarks);

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));
    routeRoles.post("/", LandmarkController.createLandmark);
  });
}
