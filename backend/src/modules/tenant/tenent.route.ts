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
    routeRoles.post("/", TenantController.createTenant);
    routeRoles.get("/:dormId", TenantController.getTenantDorm);
    routeRoles.get("/detail/:tenantId", TenantController.getTenantById);
    routeRoles.patch("/:tenantId", TenantController.updateTenant);
    routeRoles.post("/:tenantId/move-out", TenantController.moveOut);
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.TENANT]));
    routeRoles.get("/dashboard", TenantController.getDashboard);
    routeRoles.get("/bills", TenantController.getMyBills);
    routeRoles.get("/bills/:billId", TenantController.getBillById);
    routeRoles.get("/bills/:billId/print", TenantController.printBillTenant);
    routeRoles.post("/payment/generate-qr", TenantController.generateQrPayment);
    routeRoles.post("/payment/upload-slip", TenantController.uploadSlip);
    routeRoles.post("/maintenance", TenantController.createMaintenance);
    routeRoles.get(
      "/maintenance/history",
      TenantController.getMyHistoryMaintenances,
    );
  });
}
