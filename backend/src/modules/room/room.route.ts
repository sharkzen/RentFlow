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
    routeRoles.post("/bulk", RoomController.createBulk);
    routeRoles.get("/:dormId", RoomController.getRoom);
    routeRoles.patch("/:roomId", RoomController.updateRoom);
  });
}
