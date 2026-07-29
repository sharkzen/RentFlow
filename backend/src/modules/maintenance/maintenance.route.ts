import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import {
  MaintenanceController,
  updateStatusSchema,
  getMaintenanceQuerySchema,
} from "./maintenance.controller";
import { FastifyInstance } from "fastify";
import { Role } from "@/types/role.type";
import {
  zodBody,
  paginatedItemsResponse,
  okResponse,
  commonErrorResponses,
} from "@/config/swagger";

export async function maintenanceRoute(app: FastifyInstance) {
  app.register(async (route) => {
    route.addHook("preHandler", authMiddleware);
    route.addHook("preHandler", authRoleMiddleware([Role.OWNER]));

    route.get(
      "/",
      {
        schema: {
          tags: ["Maintenance (Owner)"],
          summary: "รายการคำขอแจ้งซ่อมของหอพัก (ค้นหา/กรองได้)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: zodBody(getMaintenanceQuerySchema),

          response: {
            200: paginatedItemsResponse("รายการคำขอแจ้งซ่อม"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      MaintenanceController.getMaintenance,
    );

    route.patch(
      "/:id/status",
      {
        schema: {
          tags: ["Maintenance (Owner)"],
          summary: "อัปเดตสถานะคำขอแจ้งซ่อม",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: {
            type: "object",

            properties: {
              id: {
                type: "string",
              },
            },

            required: ["id"],
          },

          body: zodBody(updateStatusSchema),

          response: {
            200: okResponse("อัปเดตสถานะสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      MaintenanceController.updateStatus,
    );
  });
}
