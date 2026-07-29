import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import {
  AnnouncementController,
  reorderSchema,
} from "./announcement.controller";
import {
  zodBody,
  okResponse,
  paginatedResponse,
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

export async function announcementRoute(app: FastifyInstance) {
  app.register(async (ownerRoutes) => {
    ownerRoutes.addHook("preHandler", authMiddleware);
    ownerRoutes.addHook("preHandler", authRoleMiddleware([Role.OWNER]));

    ownerRoutes.get(
      "/owner",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary: "รายการประกาศของหอพัก (สำหรับเจ้าของหอจัดการ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: {
            type: "object",

            properties: {
              dormitoryId: {
                type: "string",
              },

              page: {
                type: "string",
              },

              limit: {
                type: "string",
              },
            },

            required: ["dormitoryId"],
          },

          response: {
            200: paginatedResponse("รายการประกาศ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AnnouncementController.getOwnerAnnouncements,
    );

    ownerRoutes.post(
      "/",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary:
            "สร้างประกาศใหม่ (multipart/form-data: dormitoryId, title, content, type, sendEmail, image)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],

          response: {
            201: okResponse("สร้างประกาศสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AnnouncementController.createAnnouncement,
    );

    ownerRoutes.put(
      "/:id",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary:
            "แก้ไขประกาศ (multipart/form-data: title, content, type, removeImage, image)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],
          params: idParam("id"),

          response: {
            200: okResponse("แก้ไขประกาศสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AnnouncementController.updateAnnouncement,
    );

    ownerRoutes.delete(
      "/:id",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary: "ลบประกาศ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("id"),

          response: {
            200: okResponse("ลบประกาศสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AnnouncementController.deleteAnnouncement,
    );

    ownerRoutes.delete(
      "/image/:imageId",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary: "ลบรูปภาพประกอบประกาศ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("imageId"),

          response: {
            200: okResponse("ลบรูปภาพสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AnnouncementController.deleteImage,
    );

    ownerRoutes.patch(
      "/:id/pin",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary: "ปักหมุด/ยกเลิกปักหมุดประกาศ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("id"),

          response: {
            200: okResponse("อัปเดตสถานะปักหมุดสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AnnouncementController.togglePinAnnouncement,
    );

    ownerRoutes.put(
      "/reorder",
      {
        schema: {
          tags: ["Announcement (Owner)"],
          summary: "จัดเรียงลำดับประกาศ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(reorderSchema),

          response: {
            200: okResponse("จัดเรียงลำดับสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AnnouncementController.reorderAnnouncements,
    );
  });

  app.register(async (tenantRoutes) => {
    tenantRoutes.addHook("preHandler", authMiddleware);
    tenantRoutes.addHook("preHandler", authRoleMiddleware([Role.TENANT]));

    tenantRoutes.get(
      "/tenant",
      {
        schema: {
          tags: ["Announcement (Tenant)"],
          summary: "รายการประกาศของหอพักที่ผู้เช่าอาศัยอยู่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: {
            type: "object",

            properties: {
              page: {
                type: "string",
              },

              limit: {
                type: "string",
              },
            },
          },

          response: {
            200: paginatedResponse("รายการประกาศ"),
            401: commonErrorResponses[401],
          },
        },
      },
      AnnouncementController.getTenantAnnouncements,
    );

    tenantRoutes.post(
      "/tenant/:id/read",
      {
        schema: {
          tags: ["Announcement (Tenant)"],
          summary: "มาร์คว่าอ่านประกาศแล้ว (ถาวร)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("id"),

          response: {
            200: okResponse("มาร์คว่าอ่านแล้วสำเร็จ"),
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      AnnouncementController.markAsRead,
    );
  });
}
