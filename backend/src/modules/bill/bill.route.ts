import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { BillController } from "@/modules/bill/bill.controller";

import {
  getBillsQuerySchema,
  createBillsSchema,
  updateStatusSchema,
  addBillItemSchema,
  updateBillItemSchema,
  rejectBillSchema,
  sendBillEmailsSchema,
  generatePdfSchema,
  saveDraftSchema,
  scanMeterSchema,
} from "@/modules/bill/dto/bill.schema";

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

export async function billRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );

    routeRoles.post(
      "/send-emails",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ส่งอีเมลบิลไปหาผู้เช่า (แบบเลือกหลายบิล)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(sendBillEmailsSchema),

          response: {
            200: okResponse("เข้าคิวส่งอีเมลบิลสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.sendBillEmails,
    );

    routeRoles.get(
      "/:dormId",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "รายการบิลของหอพัก (ค้นหา/กรองสถานะได้)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("dormId"),
          querystring: zodBody(getBillsQuerySchema),

          response: {
            200: paginatedItemsResponse("รายการบิล"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.getBills,
    );

    routeRoles.post(
      "/",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "สร้างบิลรอบใหม่ (batch ทั้งหอ/เลือกห้อง)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createBillsSchema),

          response: {
            201: okArrayResponse("รายการบิลที่สร้างสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.createBills,
    );

    routeRoles.patch(
      "/:billId/status",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "อัปเดตสถานะบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),
          body: zodBody(updateStatusSchema),

          response: {
            200: okResponse("อัปเดตสถานะบิลสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.updateStatus,
    );

    routeRoles.delete(
      "/:billId",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ลบบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),

          response: {
            200: okResponse("ลบบิลสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.deleteBill,
    );

    routeRoles.post(
      "/:billId/items",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "เพิ่มรายการค่าใช้จ่าย/ส่วนลดในบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),
          body: zodBody(addBillItemSchema),

          response: {
            201: okResponse("เพิ่มรายการในบิลสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.addBillItem,
    );

    routeRoles.delete(
      "/:billId/items/:itemId",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ลบรายการในบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: {
            type: "object",

            properties: {
              billId: {
                type: "string",
              },

              itemId: {
                type: "string",
              },
            },

            required: ["billId", "itemId"],
          },

          response: {
            200: okResponse("ลบรายการในบิลสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.deleteBillItem,
    );

    routeRoles.patch(
      "/:billId/items/:itemId",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "แก้ไขรายการในบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: {
            type: "object",

            properties: {
              billId: {
                type: "string",
              },

              itemId: {
                type: "string",
              },
            },

            required: ["billId", "itemId"],
          },

          body: zodBody(updateBillItemSchema),

          response: {
            200: okResponse("แก้ไขรายการในบิลสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.updateBillItem,
    );

    routeRoles.post(
      "/:billId/apply-advance-payment",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "นำเงินล่วงหน้าของผู้เช่ามาหักกับบิลนี้",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),

          response: {
            200: okResponse("นำเงินล่วงหน้ามาหักบิลสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.applyAdvancePayment,
    );

    routeRoles.post(
      "/:billId/reject",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ปฏิเสธสลิปที่ผู้เช่าอัปโหลด (ให้อัปโหลดใหม่)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("billId"),
          body: zodBody(rejectBillSchema),

          response: {
            200: okResponse("ปฏิเสธสลิปสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.rejectBill,
    );

    routeRoles.get(
      "/:dormId/drafts",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "รายการฉบับร่างบิลของหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("dormId"),

          response: {
            200: okArrayResponse("รายการฉบับร่างบิล"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.getDrafts,
    );

    routeRoles.post(
      "/drafts",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "บันทึกฉบับร่างบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(saveDraftSchema),

          response: {
            201: okResponse("บันทึกฉบับร่างสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.saveDraft,
    );

    routeRoles.delete(
      "/drafts/:draftId",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ลบฉบับร่างบิล",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: idParam("draftId"),

          response: {
            200: okResponse("ลบฉบับร่างสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.deleteDraft,
    );

    routeRoles.post(
      "/upload-temp",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "อัปโหลดรูปมิเตอร์ชั่วคราว (multipart/form-data)",
          description: "ใช้ตอนกรอกฟอร์มสร้างบิล ก่อนบันทึกจริง",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],

          response: {
            200: okResponse("อัปโหลดไฟล์ชั่วคราวสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
          },
        },
      },
      BillController.uploadTempImage,
    );

    routeRoles.delete(
      "/upload-temp",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "ลบรูปมิเตอร์ชั่วคราว",

          security: [
            {
              bearerAuth: [],
            },
          ],

          querystring: {
            type: "object",

            properties: {
              objectKey: {
                type: "string",
              },
            },

            required: ["objectKey"],
          },

          response: {
            200: okResponse("ลบไฟล์ชั่วคราวสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
          },
        },
      },
      BillController.deleteTempImage,
    );

    routeRoles.post(
      "/ocr",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "อ่านเลขมิเตอร์จากรูปภาพด้วย OCR",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(scanMeterSchema),

          response: {
            200: okResponse("อ่านค่ามิเตอร์สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
          },
        },
      },
      BillController.scanMeter,
    );

    routeRoles.post(
      "/generate-pdf",
      {
        schema: {
          tags: ["Bill (Owner/Admin)"],
          summary: "สร้าง PDF บิล (แบบเลือกหลายบิล)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(generatePdfSchema),

          response: {
            200: {
              description: "ไฟล์ PDF บิล",
              type: "string",
              format: "binary",
            },

            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      BillController.generatePdf,
    );
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.OWNER]));

    routeRoles.post(
      "/:billId/upload-slip",
      {
        schema: {
          tags: ["Bill (Owner)"],
          summary: "อัปโหลดสลิปแทนผู้เช่า (เจ้าของหอบันทึกชำระเงินสด/โอน)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          consumes: ["multipart/form-data"],
          params: idParam("billId"),

          response: {
            200: okResponse("บันทึกการชำระเงินสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      BillController.uploadSlip,
    );
  });
}
