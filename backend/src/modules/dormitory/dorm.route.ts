import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { DormController } from "./dorm.controller";

import {
  getAllDormsQuerySchema,
  createDormSchema,
  updateDormSchema,
  updateDormStatusSchema,
  reorderDormImagesSchema,
  dashboardQuerySchema,
} from "@/modules/dormitory/dto/dorm.schema";

import {
  zodBody,
  okResponse,
  okArrayResponse,
  paginatedResponse,
  commonErrorResponses,
} from "@/config/swagger";

const dormIdParam = {
  type: "object",

  properties: {
    dormId: {
      type: "string",
    },
  },

  required: ["dormId"],
};

export async function dormRoute(app: FastifyInstance) {
  app.get(
    "/all",
    {
      schema: {
        tags: ["Dormitory (Public)"],
        summary: "ค้นหา/แสดงรายการหอพักที่เผยแพร่แล้ว (สำหรับผู้หาหอพัก)",
        querystring: zodBody(getAllDormsQuerySchema),

        response: {
          200: paginatedResponse("รายการหอพัก"),
        },
      },
    },
    DormController.getAllDorms,
  );

  app.get(
    "/:slug",
    {
      schema: {
        tags: ["Dormitory (Public)"],
        summary: "ดูรายละเอียดหอพักด้วย slug",

        params: {
          type: "object",

          properties: {
            slug: {
              type: "string",
            },
          },

          required: ["slug"],
        },

        response: {
          200: okResponse("รายละเอียดหอพัก"),
          404: commonErrorResponses[404],
        },
      },
    },
    DormController.getDormSlug,
  );

  app.get(
    "/:slug/cover-image",
    {
      schema: {
        tags: ["Dormitory (Public)"],
        summary: "รับลิงก์รูปปกหอพักแบบไม่หมดอายุ (สำหรับ OG image)",

        params: {
          type: "object",

          properties: {
            slug: {
              type: "string",
            },
          },

          required: ["slug"],
        },

        response: {
          404: commonErrorResponses[404],
        },
      },
    },
    DormController.getDormCoverImage,
  );

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );

    routeRoles.post(
      "/",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "สร้างหอพักใหม่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createDormSchema),

          response: {
            201: okResponse("สร้างหอพักสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
          },
        },
      },
      DormController.createDorm,
    );

    routeRoles.get(
      "/",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "รายการหอพักของเจ้าของหอที่ login อยู่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okArrayResponse("รายการหอพักของเจ้าของ"),
            401: commonErrorResponses[401],
          },
        },
      },
      DormController.getDorms,
    );

    routeRoles.get(
      "/:dormId/dashboard",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "สรุปสถิติ dashboard ของหอพัก (รายรับ/ห้อง/แจ้งซ่อม)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,
          querystring: zodBody(dashboardQuerySchema),

          response: {
            200: okResponse("ข้อมูลสรุป dashboard"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.getDashboard,
    );

    routeRoles.get(
      "/:dormId/dashboard/export",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "Export รายงานสรุปรายรับเป็น PDF",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,
          querystring: zodBody(dashboardQuerySchema),

          response: {
            200: {
              description: "ไฟล์ PDF รายงานสรุปรายรับ",
              type: "string",
              format: "binary",
            },

            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.exportDashboard,
    );

    routeRoles.put(
      "/",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "แก้ไขข้อมูลหอพัก (ข้อมูลทั่วไป/ค่าน้ำค่าไฟ/บัญชีรับเงิน)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(updateDormSchema),

          response: {
            200: okResponse("แก้ไขข้อมูลหอพักสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.updateDorms,
    );

    routeRoles.patch(
      "/:dormId/status",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "เปิด/ปิดการเผยแพร่หอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,
          body: zodBody(updateDormStatusSchema),

          response: {
            200: okResponse("อัปเดตสถานะการเผยแพร่สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      DormController.updateDormStatus,
    );

    routeRoles.delete(
      "/:dormId",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "ลบหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,

          response: {
            200: okResponse("ลบหอพักสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      DormController.deleteDorm,
    );

    routeRoles.post(
      "/:dormId/upload",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "อัปโหลดรูปภาพหอพัก (multipart/form-data, field: files)",
          description:
            "รับไฟล์ผ่าน multipart form field ชื่อ files (อัปโหลดได้หลายไฟล์)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],
          params: dormIdParam,

          response: {
            200: okArrayResponse("รายการรูปภาพที่อัปโหลดสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.uploadDormImage,
    );

    routeRoles.delete(
      "/image/:imageId",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "ลบรูปภาพหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: {
            type: "object",

            properties: {
              imageId: {
                type: "string",
              },
            },

            required: ["imageId"],
          },

          response: {
            200: okResponse("ลบรูปภาพสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      DormController.deleteDormImage,
    );

    routeRoles.put(
      "/:dormId/images/order",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "จัดเรียงลำดับรูปภาพหอพัก / กำหนดรูปปก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,
          body: zodBody(reorderDormImagesSchema),

          response: {
            200: okResponse("จัดเรียงรูปภาพสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.reorderDormImages,
    );

    routeRoles.get(
      "/:dormId/images",
      {
        schema: {
          tags: ["Dormitory (Owner/Admin)"],
          summary: "รายการรูปภาพหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: dormIdParam,

          response: {
            200: okArrayResponse("รายการรูปภาพหอพัก"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      DormController.getDormImages,
    );
  });
}
