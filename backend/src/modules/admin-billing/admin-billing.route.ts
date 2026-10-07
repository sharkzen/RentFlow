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
  planSchema,
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
