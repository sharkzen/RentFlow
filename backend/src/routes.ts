import { authRoute } from "@/modules/auth/auth.route";
import { dormRoute } from "@/modules/dormitory/dorm.route";
import { tenantRoute } from "@/modules/tenant/tenent.route";
import { landmarkRoute } from "@/modules/landmark/landmark.route";
import { roomRoute } from "@/modules/room/room.route";
import { ownerRoute } from "@/modules/owner/owner.route";
import { billRoute } from "./modules/bill/bill.route";
import { maintenanceRoute } from "./modules/maintenance/maintenance.route";
import { adminRoute } from "./modules/admin/admin.route";
import { FastifyInstance } from "fastify";

export async function indexRoute(app: FastifyInstance) {
  app.register(authRoute, {
    prefix: "/auth",
  });

  app.register(dormRoute, {
    prefix: "/dorms",
  });

  app.register(ownerRoute, {
    prefix: "/owners",
  });

  app.register(roomRoute, {
    prefix: "/rooms",
  });

  app.register(tenantRoute, {
    prefix: "/tenants",
  });

  app.register(landmarkRoute, {
    prefix: "/landmarks",
  });

  app.register(billRoute, {
    prefix: "/bills",
  });

  app.register(maintenanceRoute, {
    prefix: "/maintenances",
  });

  app.register(adminRoute, {
    prefix: "/admin",
  });
}
