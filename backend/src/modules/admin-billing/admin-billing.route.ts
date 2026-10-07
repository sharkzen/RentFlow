import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  zodBody,
  okResponse,
  commonErrorResponses,
} from "@/config/swagger";
import {
  AdminBillingService,
  couponSchema,
  planSchema,
  reviewOrderSchema,
  settingsSchema,
} from "./admin-billing.service";

const idParam = {
  type: "object",
  properties: { id: { type: "string" } },
  required: ["id"],
};

const security = [{ bearerAuth: [] }];
const tags = ["Admin Billing"];

export async function adminBillingRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));

    routeRoles.get(
      "/plans",
      {
        schema: {
          tags,
          summary: "รายการแพ็คเกจทั้งหมด",
          security,
          response: {
            200: okResponse("รายการแพ็คเกจ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (_req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await AdminBillingService.listPlans()),
    );

    routeRoles.post(
      "/plans",
      {
        schema: {
          tags,
          summary: "สร้างแพ็คเกจ",
          security,
          body: zodBody(planSchema),
          response: {
            200: okResponse("สร้างแพ็คเกจสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) => {
        const user = req.user as UserDecodedDto;
        const body = planSchema.parse(req.body);
        return reply.send(await AdminBillingService.createPlan(body, user.sub));
      },
    );

    routeRoles.put(
      "/plans/:id",
      {
        schema: {
          tags,
          summary: "แก้ไขแพ็คเกจ (ราคา/โควต้า)",
          security,
          params: idParam,
          body: zodBody(planSchema),
          response: {
            200: okResponse("แก้ไขแพ็คเกจสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      async (
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
      ) => {
        const user = req.user as UserDecodedDto;
        const body = planSchema.parse(req.body);
        return reply.send(
          await AdminBillingService.updatePlan(req.params.id, body, user.sub),
        );
      },
    );

    routeRoles.delete(
      "/plans/:id",
      {
        schema: {
          tags,
          summary: "ลบแพ็คเกจ (ถ้ามีผู้ใช้อยู่จะปิดการใช้งานแทน)",
          security,
          params: idParam,
          response: {
            200: okResponse("ลบแพ็คเกจสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      async (
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
      ) => {
        const user = req.user as UserDecodedDto;
        return reply.send(
          await AdminBillingService.deletePlan(req.params.id, user.sub),
        );
      },
    );

    routeRoles.get(
      "/coupons",
      {
        schema: {
          tags,
          summary: "รายการคูปองส่วนลด",
          security,
          response: {
            200: okResponse("รายการคูปอง"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (_req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await AdminBillingService.listCoupons()),
    );

    routeRoles.post(
      "/coupons",
      {
        schema: {
          tags,
          summary: "สร้างคูปอง (เปอร์เซ็นต์/จำนวนเงิน)",
          security,
          body: zodBody(couponSchema),
          response: {
            200: okResponse("สร้างคูปองสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) => {
        const user = req.user as UserDecodedDto;
        return reply.send(
          await AdminBillingService.createCoupon(
            couponSchema.parse(req.body),
            user.sub,
          ),
        );
      },
    );

    routeRoles.put<{ Params: { id: string } }>(
      "/coupons/:id",
      {
        schema: {
          tags,
          summary: "แก้ไขคูปอง",
          security,
          params: idParam,
          body: zodBody(couponSchema),
          response: {
            200: okResponse("แก้ไขคูปองสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      async (req, reply) => {
        const user = req.user as UserDecodedDto;
        return reply.send(
          await AdminBillingService.updateCoupon(
            req.params.id,
            couponSchema.parse(req.body),
            user.sub,
          ),
        );
      },
    );

    routeRoles.delete<{ Params: { id: string } }>(
      "/coupons/:id",
      {
        schema: {
          tags,
          summary: "ลบคูปอง (ถ้าเคยถูกใช้จะปิดการใช้งานแทน)",
          security,
          params: idParam,
          response: {
            200: okResponse("ลบคูปองสำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      async (req, reply) => {
        const user = req.user as UserDecodedDto;
        return reply.send(
          await AdminBillingService.deleteCoupon(req.params.id, user.sub),
        );
      },
    );

    routeRoles.get<{ Querystring: Record<string, string | undefined> }>(
      "/orders",
      {
        schema: {
          tags,
          summary: "รายการคำสั่งซื้อทั้งหมด (กรองสถานะ/ประเภทได้)",
          security,
          querystring: {
            type: "object",
            properties: {
              status: { type: "string" },
              type: { type: "string" },
              page: { type: "string" },
              limit: { type: "string" },
            },
          },
          response: {
            200: okResponse("รายการคำสั่งซื้อ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (req, reply) => {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));

        return reply.send(
          await AdminBillingService.listOrders({
            status: req.query.status,
            type: req.query.type,
            page,
            limit,
          }),
        );
      },
    );

    routeRoles.get<{ Params: { id: string } }>(
      "/orders/:id/slips",
      {
        schema: {
          tags,
          summary: "ลิงก์ดูสลิปของคำสั่งซื้อ (หมดอายุใน 10 นาที)",
          security,
          params: idParam,
          response: {
            200: okResponse("ลิงก์สลิป"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (req, reply) =>
        reply.send(await AdminBillingService.getOrderSlips(req.params.id)),
    );

    routeRoles.post<{ Params: { id: string } }>(
      "/orders/:id/review",
      {
        schema: {
          tags,
          summary: "อนุมัติ/ปฏิเสธคำสั่งซื้อที่รอตรวจสลิป",
          security,
          params: idParam,
          body: zodBody(reviewOrderSchema),
          response: {
            200: okResponse("ดำเนินการสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      async (req, reply) => {
        const user = req.user as UserDecodedDto;
        return reply.send(
          await AdminBillingService.reviewOrder(
            req.params.id,
            reviewOrderSchema.parse(req.body),
            user.sub,
          ),
        );
      },
    );

    routeRoles.get(
      "/settings",
      {
        schema: {
          tags,
          summary: "ตั้งค่าทดลองฟรี/grace/PromptPay/โปรโมทหอ",
          security,
          response: {
            200: okResponse("การตั้งค่า"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (_req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await AdminBillingService.getSettings()),
    );

    routeRoles.put(
      "/settings",
      {
        schema: {
          tags,
          summary: "บันทึกการตั้งค่า",
          security,
          body: zodBody(settingsSchema),
          response: {
            200: okResponse("บันทึกการตั้งค่าสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) => {
        const user = req.user as UserDecodedDto;
        const body = settingsSchema.parse(req.body);
        return reply.send(
          await AdminBillingService.updateSettings(body, user.sub),
        );
      },
    );
  });
}
