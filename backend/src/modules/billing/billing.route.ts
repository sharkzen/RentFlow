import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { slipUploadRateLimit as slipUploadUserRateLimit } from "@/middleware/slip-rate-limit.middleware";
import { Role } from "@/types/role.type";
import { UserDecodedDto } from "@/modules/auth/dto/user.dto";
import { AppError } from "@/lib/errors";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  zodBody,
  okResponse,
  commonErrorResponses,
} from "@/config/swagger";
import {
  BillingService,
  createOrderSchema,
  previewCouponSchema,
} from "./billing.service";

const idParam = {
  type: "object",
  properties: { id: { type: "string" } },
  required: ["id"],
};

const security = [{ bearerAuth: [] }];
const tags = ["Billing (Owner)"];

const errors = {
  400: commonErrorResponses[400],
  401: commonErrorResponses[401],
  403: commonErrorResponses[403],
  404: commonErrorResponses[404],
};

export async function billingRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.OWNER]));

    const userId = (req: FastifyRequest) =>
      (req.user as UserDecodedDto).sub;

    routeRoles.get(
      "/plans",
      {
        schema: {
          tags,
          summary: "แพ็คเกจที่เปิดขาย",
          security,
          response: { 200: okResponse("รายการแพ็คเกจ"), ...errors },
        },
      },
      async (_req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await BillingService.listPlans()),
    );

    routeRoles.get(
      "/me",
      {
        schema: {
          tags,
          summary: "แพ็คเกจปัจจุบัน โควต้า สิทธิ์ทดลอง และสถานะโปรโมท",
          security,
          response: { 200: okResponse("ข้อมูลแพ็คเกจ"), ...errors },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await BillingService.getMyBilling(userId(req))),
    );

    routeRoles.post(
      "/coupons/preview",
      {
        schema: {
          tags,
          summary: "ตรวจคูปองและดูราคาหลังหักส่วนลด",
          security,
          body: zodBody(previewCouponSchema),
          response: { 200: okResponse("ราคาหลังหักส่วนลด"), ...errors },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) =>
        reply.send(
          await BillingService.previewCoupon(
            userId(req),
            previewCouponSchema.parse(req.body),
          ),
        ),
    );

    routeRoles.post(
      "/trial",
      {
        schema: {
          tags,
          summary: "รับสิทธิ์ทดลองใช้ฟรี (ครั้งเดียวต่อบัญชี)",
          security,
          response: { 200: okResponse("เริ่มทดลองใช้งาน"), ...errors },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await BillingService.claimTrial(userId(req))),
    );

    routeRoles.get(
      "/orders",
      {
        schema: {
          tags,
          summary: "ประวัติคำสั่งซื้อ",
          security,
          response: { 200: okResponse("รายการคำสั่งซื้อ"), ...errors },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) =>
        reply.send(await BillingService.listOrders(userId(req))),
    );

    routeRoles.post(
      "/orders",
      {
        schema: {
          tags,
          summary: "สร้างคำสั่งซื้อแพ็คเกจหรือโปรโมทหอ",
          security,
          body: zodBody(createOrderSchema),
          response: { 200: okResponse("สร้างคำสั่งซื้อสำเร็จ"), ...errors },
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) =>
        reply.send(
          await BillingService.createOrder(
            userId(req),
            createOrderSchema.parse(req.body),
          ),
        ),
    );

    routeRoles.get<{ Params: { id: string } }>(
      "/orders/:id",
      {
        schema: {
          tags,
          summary: "รายละเอียดคำสั่งซื้อ + บัญชีรับเงิน + QR (หน้าสรุป/ชำระเงิน)",
          security,
          params: idParam,
          response: { 200: okResponse("รายละเอียดคำสั่งซื้อ"), ...errors },
        },
      },
      async (req, reply) =>
        reply.send(await BillingService.getOrder(userId(req), req.params.id)),
    );

    routeRoles.post(
      "/orders/:id/cancel",
      {
        schema: {
          tags,
          summary: "ยกเลิกคำสั่งซื้อที่ยังไม่ชำระ",
          security,
          params: idParam,
          response: { 200: okResponse("ยกเลิกสำเร็จ"), ...errors },
        },
      },
      async (
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
      ) =>
        reply.send(await BillingService.cancelOrder(userId(req), req.params.id)),
    );

    routeRoles.post<{ Params: { id: string } }>(
      "/orders/:id/slip",
      {
        config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
        preHandler: slipUploadUserRateLimit,
        schema: {
          tags,
          summary: "อัปโหลดสลิปชำระคำสั่งซื้อ (multipart/form-data: file)",
          security,
          params: idParam,
          consumes: ["multipart/form-data"],
          response: { 200: okResponse("ส่งสลิปสำเร็จ"), ...errors },
        },
      },
      async (
        req: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
      ) => {
        // ไม่ใช่ multipart จะทำให้ req.file() โยน error (500) ต้องตอบ 400 ให้ชัดเจน
        const part = req.isMultipart() ? await req.file() : undefined;

        if (!part) {
          throw AppError.badRequest("FILE_REQUIRED", "กรุณาอัพโหลดรูปภาพสลิป");
        }

        const fileBuffer = await part.toBuffer();

        return reply.send(
          await BillingService.submitSlip(
            userId(req),
            req.params.id,
            fileBuffer,
          ),
        );
      },
    );
  });
}

/** เส้นทางสาธารณะ (ไม่ต้องล็อกอิน) แยก plugin เพื่อไม่ติด hook ของเจ้าของหอ */
export async function billingPublicRoute(app: FastifyInstance) {
  app.get(
    "/pricing",
    {
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
      schema: {
        tags: ["Billing (Public)"],
        summary: "ราคาแพ็คเกจและโปรโมทหอ (สาธารณะ)",
        response: { 200: okResponse("ข้อมูลราคา") },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) =>
      reply.send(await BillingService.getPublicPricing()),
  );
}
