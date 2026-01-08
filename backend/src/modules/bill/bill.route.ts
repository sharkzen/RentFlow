import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { BillController } from "@/modules/bill/bill.controller";

export async function billRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );
    routeRoles.get("/:dormId", BillController.getBills);
    routeRoles.post("/", BillController.createBills);
    routeRoles.patch("/:billId/status", BillController.updateStatus);
  });
}
