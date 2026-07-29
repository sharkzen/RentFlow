import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { AuthController } from "@/modules/auth/auth.controller";
import { zodBody, okResponse, commonErrorResponses } from "@/config/swagger";

import {
  adminRegisterSchema,
  ownerRegisterSchema,
  loginSchema,
  loginWithQrSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from "@/modules/auth/dto/auth.schema";

const bruteForceRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};

export async function authRoute(app: FastifyInstance) {
  app.post(
    "/register-admin",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "สมัครบัญชี Admin",
        body: zodBody(adminRegisterSchema),

        response: {
          201: okResponse("สมัคร Admin สำเร็จ"),
          400: commonErrorResponses[400],
          409: commonErrorResponses[409],
        },
      },
    },
    AuthController.register,
  );

  app.post(
    "/register-owner",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "สมัครบัญชีเจ้าของหอพัก (พร้อมสร้างหอพักแรก)",
        body: zodBody(ownerRegisterSchema),

        response: {
          201: okResponse("สมัครเจ้าของหอพักสำเร็จ"),
          400: commonErrorResponses[400],
          409: commonErrorResponses[409],
        },
      },
    },
    AuthController.ownerRegister,
  );

  app.post(
    "/refresh",
    {
      schema: {
        tags: ["Auth (Public)"],
        summary: "ขอ access token ใหม่จาก refresh token (cookie)",

        response: {
          200: okResponse("ออก access token ใหม่สำเร็จ"),
          401: commonErrorResponses[401],
        },
      },
    },
    AuthController.refresh,
  );

  app.post(
    "/login",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน",
        body: zodBody(loginSchema),

        response: {
          200: okResponse("เข้าสู่ระบบสำเร็จ"),
          400: commonErrorResponses[400],
          401: commonErrorResponses[401],
        },
      },
    },
    AuthController.login,
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["Auth (Public)"],
        summary: "ออกจากระบบ (ล้าง cookie token)",

        response: {
          200: okResponse("ออกจากระบบสำเร็จ"),
        },
      },
    },
    AuthController.logout,
  );

  app.post(
    "/login/qr",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "เข้าสู่ระบบผู้เช่าด้วย QR Code ประจำห้อง",
        body: zodBody(loginWithQrSchema),

        response: {
          200: okResponse("เข้าสู่ระบบสำเร็จ"),
          400: commonErrorResponses[400],
          401: commonErrorResponses[401],
        },
      },
    },
    AuthController.loginWithQr,
  );

  app.post(
    "/forgot-password",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "ขอรหัส OTP รีเซ็ตรหัสผ่านทางอีเมล",
        body: zodBody(forgotPasswordSchema),

        response: {
          200: okResponse(
            "ส่งรหัส OTP รีเซ็ตรหัสผ่านสำเร็จ (ถ้ามีบัญชีนี้อยู่จริง)",
          ),
          400: commonErrorResponses[400],
        },
      },
    },
    AuthController.forgotPassword,
  );

  app.post(
    "/verify-otp",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "ตรวจสอบรหัส OTP รีเซ็ตรหัสผ่าน",
        body: zodBody(verifyOtpSchema),

        response: {
          200: okResponse("ตรวจสอบ OTP สำเร็จ"),
          400: commonErrorResponses[400],
        },
      },
    },
    AuthController.verifyOtp,
  );

  app.post(
    "/reset-password",
    {
      ...bruteForceRateLimit,

      schema: {
        tags: ["Auth (Public)"],
        summary: "ตั้งรหัสผ่านใหม่ด้วย reset token ที่ได้จากการยืนยัน OTP",
        body: zodBody(resetPasswordSchema),

        response: {
          200: okResponse("รีเซ็ตรหัสผ่านสำเร็จ"),
          400: commonErrorResponses[400],
        },
      },
    },
    AuthController.resetPassword,
  );

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER, Role.TENANT]),
    );

    routeRoles.get(
      "/me",
      {
        schema: {
          tags: ["Auth (Public)"],
          summary: "ดูข้อมูลผู้ใช้ที่ login อยู่ปัจจุบัน",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("ข้อมูลผู้ใช้ปัจจุบัน"),
            401: commonErrorResponses[401],
          },
        },
      },
      AuthController.me,
    );
  });
}
