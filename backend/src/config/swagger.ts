import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { authMiddleware, authRoleMiddleware } from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { zodToJsonSchema } from "zod-to-json-schema";

export const zodBody = (schema: any) =>
  zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  });

export const SWAGGER_TAGS = [
  {
    name: "Auth (Public)",
    description: "สมัคร/เข้าสู่ระบบ/รีเซ็ตรหัสผ่าน — ไม่ต้อง login",
  },
  {
    name: "Dormitory (Public)",
    description: "ค้นหา/ดูรายละเอียดหอพัก — ฝั่งผู้หาหอพัก ไม่ต้อง login",
  },
  {
    name: "Dormitory (Owner/Admin)",
    description: "จัดการหอพักของตัวเอง — OWNER, ADMIN",
  },
  {
    name: "Room (Owner/Admin)",
    description: "จัดการห้องพักและ QR เข้าห้อง — OWNER, ADMIN",
  },
  {
    name: "Tenant Management (Owner/Admin)",
    description: "จัดการผู้เช่าโดยเจ้าของหอ — OWNER, ADMIN",
  },
  {
    name: "Tenant Self-Service (Tenant)",
    description: "ฟีเจอร์สำหรับผู้เช่าจัดการตัวเอง — TENANT",
  },
  {
    name: "Bill (Owner/Admin)",
    description: "จัดการบิล/รายการบิล — OWNER, ADMIN",
  },
  {
    name: "Bill (Owner)",
    description: "อัปโหลดสลิปแทนผู้เช่า — OWNER",
  },
  {
    name: "Maintenance (Owner)",
    description: "จัดการคำขอแจ้งซ่อม — OWNER",
  },
  {
    name: "Announcement (Owner)",
    description: "จัดการประกาศของหอพัก — OWNER",
  },
  {
    name: "Announcement (Tenant)",
    description: "ดู/มาร์คอ่านประกาศ — TENANT",
  },
  {
    name: "Landmark (Public)",
    description: "รายการสถานที่สำคัญ — public",
  },
  {
    name: "Landmark (Admin)",
    description: "จัดการสถานที่สำคัญ — ADMIN",
  },
  {
    name: "Owner Profile (Owner)",
    description: "ข้อมูลโปรไฟล์เจ้าของหอ — OWNER",
  },
  {
    name: "Feature Flags (Admin)",
    description: "จัดการ feature flag — ADMIN",
  },
  {
    name: "Feature Flags (Owner/Admin read)",
    description: "อ่านสถานะ feature flag — OWNER, ADMIN",
  },
  {
    name: "Admin",
    description: "ฟังก์ชันเฉพาะแอดมิน — อนุมัติเจ้าของหอ, จัดการผู้ใช้, หอพักแนะนำ ฯลฯ",
  },
];

const errorSchema = (description: string) => ({
  description,
  type: "object",
  additionalProperties: true,

  properties: {
    message: {
      type: "string",
    },

    code: {
      type: "string",
    },

    detail: {
      type: "string",
    },
  },
});

export const okResponse = (
  description: string,
  properties: Record<string, any> = {},
) => ({
  description,
  type: "object",
  additionalProperties: true,
  properties,
});

export const okArrayResponse = (
  description: string,
  itemProperties: Record<string, any> = {},
) => ({
  description,
  type: "array",

  items: {
    type: "object",
    additionalProperties: true,
    properties: itemProperties,
  },
});

export const paginatedResponse = (
  description: string,
  itemProperties: Record<string, any> = {},
) => ({
  description,
  type: "object",
  additionalProperties: true,

  properties: {
    data: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: true,
        properties: itemProperties,
      },
    },

    meta: {
      type: "object",
      additionalProperties: true,

      properties: {
        total: {
          type: "number",
        },

        page: {
          type: "number",
        },

        limit: {
          type: "number",
        },

        totalPages: {
          type: "number",
        },
      },
    },
  },
});

export const paginatedItemsResponse = (
  description: string,
  itemProperties: Record<string, any> = {},
) => ({
  description,
  type: "object",
  additionalProperties: true,

  properties: {
    items: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: true,
        properties: itemProperties,
      },
    },

    total: {
      type: "number",
    },

    page: {
      type: "number",
    },

    limit: {
      type: "number",
    },

    totalPages: {
      type: "number",
    },
  },
});

export const commonErrorResponses = {
  400: errorSchema("Bad Request / Validation Error"),
  401: errorSchema("Unauthorized — ไม่ได้ login หรือ token ไม่ถูกต้อง"),
  403: errorSchema("Forbidden — role ไม่มีสิทธิ์เข้าถึง"),
  404: errorSchema("Not Found"),
  409: errorSchema("Conflict"),
  500: errorSchema("Internal Server Error"),
};

export async function registerSwagger(app: FastifyInstance) {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.0",

      info: {
        title: "RentFlow API",
        version: "1.0.0",
        description:
          "เอกสาร API ระบบจัดการหอพัก RentFlow — เข้าถึงได้เฉพาะผู้ใช้ role ADMIN เท่านั้น",
      },

      tags: SWAGGER_TAGS,

      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(async (docsScope) => {
    docsScope.addHook("preHandler", authMiddleware);
    docsScope.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));

    await docsScope.register(fastifySwaggerUi, {
      routePrefix: "/docs",

      uiConfig: {
        persistAuthorization: true,
      },
    });
  });
}
