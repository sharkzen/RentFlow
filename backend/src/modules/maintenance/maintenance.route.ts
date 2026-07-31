import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import {
  MaintenanceController,
  updateStatusSchema,
  getMaintenanceQuerySchema,
  sendMessageSchema,
  editMessageSchema,
} from "./maintenance.controller";
import { FastifyInstance } from "fastify";
import { Role } from "@/types/role.type";
import {
  zodBody,
  paginatedItemsResponse,
  okArrayResponse,
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

    route.get(
      "/:id/messages",
      {
        schema: {
          tags: ["Maintenance (Owner)"],
          summary: "รายการข้อความแชทของคำขอแจ้งซ่อม",

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

          response: {
            200: okArrayResponse("รายการข้อความ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      MaintenanceController.getMessages,
    );

    route.post(
      "/:id/messages",
      {
        schema: {
          tags: ["Maintenance (Owner)"],
          summary: "ส่งข้อความแชทถึงผู้เช่า",

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

          body: zodBody(sendMessageSchema),

          response: {
            200: okResponse("ส่งข้อความสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      MaintenanceController.sendMessage,
    );

    route.patch(
      "/:id/messages/:messageId",
      {
        schema: {
          tags: ["Maintenance (Owner)"],
          summary: "แก้ไขข้อความแชทของตัวเอง",

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

              messageId: {
                type: "string",
              },
            },

            required: ["id", "messageId"],
          },

          body: zodBody(editMessageSchema),

          response: {
            200: okResponse("แก้ไขข้อความสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      MaintenanceController.editMessage,
    );
  });
}
