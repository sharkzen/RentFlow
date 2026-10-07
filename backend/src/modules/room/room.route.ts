import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { requireManageAccess } from "@/middleware/subscription.middleware";
import { FastifyInstance } from "fastify";
import { RoomController } from "./room.controller";

import {
  createBulkRoomsSchema,
  toggleQrStatusSchema,
  generateBulkPdfSchema,
  updateRoomSchema,
  getRoomsQuerySchema,
} from "@/modules/room/dto/room.schema";

import {
  zodBody,
  okResponse,
  okArrayResponse,
  paginatedItemsResponse,
  commonErrorResponses,
} from "@/config/swagger";

const idParam = (name: string) => ({
  type: "object",

  properties: {
    [name]: {
      type: "string",
    },
  },

  required: [name],
});

export async function roomRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );

    routeRoles.post(
      "/qr-auth/bulk-pdf",
      {
        preHandler: requireManageAccess,
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "สร้าง PDF QR Code เข้าห้องแบบหลายห้องพร้อมกัน",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(generateBulkPdfSchema),

          response: {
            200: {
              description: "ไฟล์ PDF QR Code",
              type: "string",
              format: "binary",
            },

            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      RoomController.generateBulkPdf,
    );

    routeRoles.post(
      "/:roomId/qr-auth",
      {
        preHandler: requireManageAccess,
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "สร้าง/ต่ออายุ QR Code เข้าห้อง",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("roomId"),

          response: {
            200: okResponse("สร้าง/ต่ออายุ QR Code สำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      RoomController.createOrRenewQr,
    );

    routeRoles.patch(
      "/:roomId/qr-auth/status",
      {
        preHandler: requireManageAccess,
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "เปิด/ปิดการใช้งาน QR Code เข้าห้อง",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("roomId"),
          body: zodBody(toggleQrStatusSchema),

          response: {
            200: okResponse("เปลี่ยนสถานะ QR Code สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      RoomController.toggleQrStatus,
    );

    routeRoles.get(
      "/:dormId/rooms",
      {
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "รายการห้องพักทั้งหมดของหอ (แบบย่อ, กรองตามสถานะได้)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("dormId"),

          response: {
            200: okArrayResponse("รายการห้องพัก"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      RoomController.getRooms,
    );

    routeRoles.post(
      "/bulk",
      {
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "สร้างห้องพักหลายห้องพร้อมกัน",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createBulkRoomsSchema),

          response: {
            201: okResponse("สร้างห้องพักสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      RoomController.createBulk,
    );

    routeRoles.get(
      "/:dormId",
      {
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "รายการห้องพักของหอ (แบบละเอียด พร้อมค้นหา/แบ่งหน้า)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("dormId"),
          querystring: zodBody(getRoomsQuerySchema),

          response: {
            200: paginatedItemsResponse("รายการห้องพัก"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      RoomController.getRoom,
    );

    routeRoles.patch(
      "/:roomId",
      {
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "แก้ไขข้อมูลห้องพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("roomId"),
          body: zodBody(updateRoomSchema),

          response: {
            200: okResponse("แก้ไขข้อมูลห้องพักสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      RoomController.updateRoom,
    );

    routeRoles.delete(
      "/:roomId",
      {
        schema: {
          tags: ["Room (Owner/Admin)"],
          summary: "ลบห้องพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("roomId"),

          response: {
            200: okResponse("ลบห้องพักสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      RoomController.deleteRoom,
    );
  });
}
