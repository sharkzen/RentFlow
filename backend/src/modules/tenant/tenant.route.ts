import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { requireManageAccess } from "@/middleware/subscription.middleware";
import { FastifyInstance } from "fastify";
import { TenantController } from "@/modules/tenant/tenant.controller";
import { slipUploadRateLimit as slipUploadUserRateLimit } from "@/middleware/slip-rate-limit.middleware";

import {
  getTenantDormQuerySchema,
  getMyBillsQuerySchema,
  createTenantSchema,
  updateTenantSchema,
  moveOutSchema,
  generateQrPaymentSchema,
  getMaintenanceQuerySchema,
  reEntryTenantSchema,
  sendMaintenanceMessageSchema,
  editMaintenanceMessageSchema,
} from "@/modules/tenant/dto/tenant.schema";

import {
  zodBody,
  okResponse,
  okArrayResponse,
  paginatedItemsResponse,
  commonErrorResponses,
} from "@/config/swagger";

const slipUploadRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};

const idParam = (name: string) => ({
  type: "object",

  properties: {
    [name]: {
      type: "string",
    },
  },

  required: [name],
});

export async function tenantRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER]),
    );
    routeRoles.addHook("preHandler", requireManageAccess);

    routeRoles.post(
      "/",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "เพิ่มผู้เช่าใหม่เข้าห้องพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createTenantSchema),

          response: {
            201: okResponse("เพิ่มผู้เช่าสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      TenantController.createTenant,
    );

    routeRoles.get(
      "/:dormId",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "รายชื่อผู้เช่าในหอพัก (ค้นหา/กรองได้)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("dormId"),
          querystring: zodBody(getTenantDormQuerySchema),

          response: {
            200: paginatedItemsResponse("รายชื่อผู้เช่า"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      TenantController.getTenantDorm,
    );

    routeRoles.get(
      "/detail/:tenantId",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "รายละเอียดผู้เช่ารายบุคคล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("tenantId"),

          response: {
            200: okResponse("รายละเอียดผู้เช่า"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.getTenantById,
    );

    routeRoles.patch(
      "/:tenantId",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "แก้ไขข้อมูลผู้เช่า",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("tenantId"),
          body: zodBody(updateTenantSchema),

          response: {
            200: okResponse("แก้ไขข้อมูลผู้เช่าสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.updateTenant,
    );

    routeRoles.post(
      "/:tenantId/move-out",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "ย้ายผู้เช่าออก (ทันทีหรือกำหนดวันล่วงหน้า)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("tenantId"),
          body: zodBody(moveOutSchema),

          response: {
            200: okResponse("บันทึกการย้ายออกสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.moveOut,
    );

    routeRoles.post(
      "/re-entry",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary:
            "สร้างสัญญาเช่าใหม่ให้ผู้ใช้ที่เคยเป็นผู้เช่ามาก่อน (เข้าอยู่ซ้ำ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(reEntryTenantSchema),

          response: {
            200: okResponse("สร้างสัญญาเช่าใหม่สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      TenantController.reEntryTenant,
    );

    routeRoles.post(
      "/:tenantId/cancel-move-out",
      {
        schema: {
          tags: ["Tenant Management (Owner/Admin)"],
          summary: "ยกเลิกการย้ายออกที่กำหนดไว้ล่วงหน้า",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("tenantId"),

          response: {
            200: okResponse("ยกเลิกการย้ายออกสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.cancelMoveOut,
    );
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.TENANT]));

    routeRoles.get(
      "/dashboard",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "ข้อมูลสรุป dashboard ของผู้เช่า",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("ข้อมูลสรุป dashboard ผู้เช่า"),
            401: commonErrorResponses[401],
          },
        },
      },
      TenantController.getDashboard,
    );

    routeRoles.get(
      "/bills",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "รายการบิลของผู้เช่าที่ login อยู่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: zodBody(getMyBillsQuerySchema),

          response: {
            200: paginatedItemsResponse("รายการบิลของผู้เช่า"),
            401: commonErrorResponses[401],
          },
        },
      },
      TenantController.getMyBills,
    );

    routeRoles.get(
      "/bills/:billId",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "รายละเอียดบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),

          response: {
            200: okResponse("รายละเอียดบิล"),
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.getBillById,
    );

    routeRoles.get(
      "/bills/:billId/print",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "พิมพ์/ดาวน์โหลดบิลเป็น PDF",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),

          response: {
            200: {
              description: "ไฟล์ PDF ของบิล",
              type: "string",
              format: "binary",
            },

            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.printBillTenant,
    );

    routeRoles.post(
      "/payment/generate-qr",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "สร้าง QR PromptPay สำหรับชำระบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(generateQrPaymentSchema),

          response: {
            200: okResponse("สร้าง QR ชำระเงินสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.generateQrPayment,
    );

    routeRoles.post(
      "/payment/upload-slip",
      {
        ...slipUploadRateLimit,
        preHandler: slipUploadUserRateLimit,

        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary:
            "อัปโหลดสลิปชำระเงิน (multipart/form-data: file, billId, refNo)",
          description:
            "field ไฟล์รูปสลิป + field billId (จำเป็น) + field refNo (ไม่บังคับ)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],

          response: {
            200: okResponse("อัปโหลดสลิปสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.uploadSlip,
    );

    routeRoles.post(
      "/maintenance",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary:
            "แจ้งซ่อม (multipart/form-data: title, description, ไฟล์แนบสูงสุด 2 รูป)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],

          response: {
            201: okResponse("แจ้งซ่อมสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.createMaintenance,
    );

    routeRoles.get(
      "/maintenance/history",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "ประวัติการแจ้งซ่อมของผู้เช่า",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: zodBody(getMaintenanceQuerySchema),

          response: {
            200: paginatedItemsResponse("ประวัติการแจ้งซ่อม"),
            401: commonErrorResponses[401],
          },
        },
      },
      TenantController.getMyHistoryMaintenances,
    );

    routeRoles.patch(
      "/maintenance/:requestId",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary:
            "แก้ไขคำขอแจ้งซ่อม (multipart/form-data: title, description, images, deletedImageIds)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],
          params: idParam("requestId"),

          response: {
            200: okResponse("แก้ไขคำขอแจ้งซ่อมสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.updateMaintenance,
    );

    routeRoles.delete(
      "/maintenance/:requestId",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "ยกเลิกคำขอแจ้งซ่อม (ยกเลิกได้เฉพาะสถานะ OPEN)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("requestId"),

          response: {
            200: okResponse("ยกเลิกคำขอแจ้งซ่อมสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.cancelMaintenance,
    );

    routeRoles.get(
      "/maintenance/:requestId/messages",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "รายการข้อความแชทของคำขอแจ้งซ่อม",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("requestId"),

          response: {
            200: okArrayResponse("รายการข้อความ"),
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.getMaintenanceMessages,
    );

    routeRoles.post(
      "/maintenance/:requestId/messages",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "ส่งข้อความแชทถึงเจ้าของหอ",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("requestId"),
          body: zodBody(sendMaintenanceMessageSchema),

          response: {
            200: okResponse("ส่งข้อความสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.sendMaintenanceMessage,
    );

    routeRoles.patch(
      "/maintenance/:requestId/messages/:messageId",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "แก้ไขข้อความแชทของตัวเอง",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: {
            type: "object",

            properties: {
              requestId: {
                type: "string",
              },

              messageId: {
                type: "string",
              },
            },

            required: ["requestId", "messageId"],
          },

          body: zodBody(editMaintenanceMessageSchema),

          response: {
            200: okResponse("แก้ไขข้อความสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            404: commonErrorResponses[404],
          },
        },
      },
      TenantController.editMaintenanceMessage,
    );

    routeRoles.get(
      "/contract",
      {
        schema: {
          tags: ["Tenant Self-Service (Tenant)"],
          summary: "รายละเอียดสัญญาเช่าของผู้เช่า",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("รายละเอียดสัญญาเช่า"),
            401: commonErrorResponses[401],
          },
        },
      },
      TenantController.getContractDetail,
    );
  });
}
