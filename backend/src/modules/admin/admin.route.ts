import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";

import {
  AdminController,
  createLandmarkSchema,
  updateLandmarkSchema,
  togglePublishSchema,
  toggleFeaturedSchema,
  reorderFeaturedSchema,
  updateStatusSchema,
} from "./admin.controller";

import {
  zodBody,
  okResponse,
  okArrayResponse,
  paginatedResponse,
  commonErrorResponses,
} from "@/config/swagger";

const idParam = {
  type: "object",

  properties: {
    id: {
      type: "string",
    },
  },

  required: ["id"],
};

const pageQuery = {
  type: "object",

  properties: {
    page: {
      type: "string",
    },

    limit: {
      type: "string",
    },

    q: {
      type: "string",
    },
  },
};

export async function adminRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));

    routeRoles.get(
      "/dashboard",
      {
        schema: {
          tags: ["Admin"],
          summary: "สรุปสถิติภาพรวมระบบ (จำนวนผู้ใช้/หอพัก/พื้นที่จัดเก็บ ฯลฯ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("สรุปสถิติภาพรวมระบบ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getDashboard,
    );

    routeRoles.get(
      "/approvals",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายชื่อเจ้าของหอที่รอการอนุมัติ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: pageQuery,

          response: {
            200: paginatedResponse("รายชื่อเจ้าของหอที่รออนุมัติ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getPendingList,
    );

    routeRoles.patch(
      "/approvals/:id/approve",
      {
        schema: {
          tags: ["Admin"],
          summary: "อนุมัติเจ้าของหอ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("อนุมัติเจ้าของหอสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.approve,
    );

    routeRoles.patch(
      "/approvals/:id/reject",
      {
        schema: {
          tags: ["Admin"],
          summary: "ปฏิเสธ/ลบคำขอสมัครเจ้าของหอ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("ปฏิเสธคำขอสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.reject,
    );

    routeRoles.get(
      "/dormitories",
      {
        schema: {
          tags: ["Admin"],
          summary:
            "รายการหอพักทั้งหมดในระบบ (ค้นหา/กรองสถานะ/publish/featured)",

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

              q: {
                type: "string",
              },

              status: {
                type: "string",
              },

              published: {
                type: "string",
              },

              featured: {
                type: "string",
              },
            },
          },

          response: {
            200: paginatedResponse("รายการหอพักทั้งหมด"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getList,
    );

    routeRoles.get(
      "/dormitories/featured",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายการหอพักที่ถูกปักหมุดแนะนำ (เรียงตามลำดับ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okArrayResponse("รายการหอพักแนะนำ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getFeaturedList,
    );

    routeRoles.put(
      "/dormitories/featured/order",
      {
        schema: {
          tags: ["Admin"],
          summary: "จัดเรียงลำดับหอพักแนะนำ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(reorderFeaturedSchema),

          response: {
            200: okResponse("จัดเรียงลำดับสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.reorderFeatured,
    );

    routeRoles.get(
      "/dormitories/:id",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายละเอียดหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("รายละเอียดหอพัก"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.getDetail,
    );

    routeRoles.patch(
      "/dormitories/:id/publish",
      {
        schema: {
          tags: ["Admin"],
          summary: "เปิด/ปิดการเผยแพร่หอพัก (โดยแอดมิน)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,
          body: zodBody(togglePublishSchema),

          response: {
            200: okResponse("อัปเดตสถานะการเผยแพร่สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.togglePublish,
    );

    routeRoles.patch(
      "/dormitories/:id/featured",
      {
        schema: {
          tags: ["Admin"],
          summary: "ปักหมุด/ยกเลิกปักหมุดหอพักแนะนำ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,
          body: zodBody(toggleFeaturedSchema),

          response: {
            200: okResponse("อัปเดตสถานะแนะนำสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.toggleFeatured,
    );

    routeRoles.patch(
      "/dormitories/:id/status",
      {
        schema: {
          tags: ["Admin"],
          summary: "เปลี่ยนสถานะหอพัก (ACTIVE/BANNED ฯลฯ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,
          body: zodBody(updateStatusSchema),

          response: {
            200: okResponse("อัปเดตสถานะหอพักสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.updateStatus,
    );

    routeRoles.get(
      "/users/owners",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายชื่อเจ้าของหอทั้งหมด (ค้นหา/กรองสถานะ)",

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

              q: {
                type: "string",
              },

              status: {
                type: "string",
              },
            },
          },

          response: {
            200: paginatedResponse("รายชื่อเจ้าของหอ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getOwners,
    );

    routeRoles.get(
      "/users/owners/:id",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายละเอียดเจ้าของหอรายบุคคล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("รายละเอียดเจ้าของหอ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.getOwnerById,
    );

    routeRoles.patch(
      "/users/:id/status",
      {
        schema: {
          tags: ["Admin"],
          summary: "เปลี่ยนสถานะผู้ใช้งาน (BANNED/ACTIVE ฯลฯ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,
          body: zodBody(updateStatusSchema),

          response: {
            200: okResponse("อัปเดตสถานะผู้ใช้สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.updateUserStatus,
    );

    routeRoles.get(
      "/users/locked",
      {
        schema: {
          tags: ["Admin"],
          summary:
            "รายชื่อบัญชีที่ถูกล็อคชั่วคราวจากการเข้าสู่ระบบผิดหลายครั้ง",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: pageQuery,

          response: {
            200: paginatedResponse("รายชื่อบัญชีที่ถูกล็อค"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getLockedUsers,
    );

    routeRoles.patch(
      "/users/:id/unlock",
      {
        schema: {
          tags: ["Admin"],
          summary: "ปลดล็อคบัญชีผู้ใช้งาน",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("ปลดล็อคบัญชีสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.unlockUser,
    );

    routeRoles.get(
      "/landmarks",
      {
        schema: {
          tags: ["Admin"],
          summary: "รายการสถานที่สำคัญ (จัดการโดยแอดมิน)",

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

              q: {
                type: "string",
              },

              type: {
                type: "string",
              },
            },
          },

          response: {
            200: paginatedResponse("รายการสถานที่สำคัญ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.getLandmarks,
    );

    routeRoles.post(
      "/landmarks",
      {
        schema: {
          tags: ["Admin"],
          summary: "สร้างสถานที่สำคัญใหม่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createLandmarkSchema),

          response: {
            201: okResponse("สร้างสถานที่สำคัญสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      AdminController.createLandmark,
    );

    routeRoles.put(
      "/landmarks/:id",
      {
        schema: {
          tags: ["Admin"],
          summary: "แก้ไขสถานที่สำคัญ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,
          body: zodBody(updateLandmarkSchema),

          response: {
            200: okResponse("แก้ไขสถานที่สำคัญสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.updateLandmark,
    );

    routeRoles.delete(
      "/landmarks/:id",
      {
        schema: {
          tags: ["Admin"],
          summary: "ลบสถานที่สำคัญ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam,

          response: {
            200: okResponse("ลบสถานที่สำคัญสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      AdminController.deleteLandmark,
    );
  });
}
