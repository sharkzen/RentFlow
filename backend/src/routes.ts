import { authRoute } from "@/modules/auth/auth.route";
import { dormRoute } from "@/modules/dormitory/dorm.route";
import { tenantRoute } from "@/modules/tenant/tenent.route";
import { FastifyInstance } from "fastify";

export async function indexRoute(app: FastifyInstance) {
  app.register(authRoute, { prefix: "/auth" });
  app.register(dormRoute, { prefix: "/dorms" });
  app.register(tenantRoute, { prefix: "/tenants" });
}
