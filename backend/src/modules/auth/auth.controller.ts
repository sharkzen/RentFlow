import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "@/modules/auth/auth.service";
import { signAccessToken, signRefreshToken } from "@/utils/jwt";
import logger from "@/utils/logger";
import { env } from "@/config/env";
import { AppError } from "@/lib/errors";
import {
  adminRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  loginWithQrSchema,
  ownerRegisterSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
} from "@/modules/auth/dto/auth.schema";

export const AuthController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    const me = await authService.me(user);

    const { password, ...rest } = me;

    reply.send(rest);
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies.refresh_token;

    if (!token) {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    let accessToken: string;

    try {
      accessToken = await authService.refreshAccessToken(token);
    } catch {
      throw AppError.unauthorized("UNAUTHORIZED");
    }

    reply.setCookie("access_token", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    reply.send({
      ok: true,
    });
  },

  async register(request: FastifyRequest, reply: FastifyReply) {
    const dto = adminRegisterSchema.parse(request.body);

    try {
      const user = await authService.registerAdmin(dto);
      reply.status(201).send(user);
    } catch (error: any) {
      if (error.message === "DATA_ARE_NOT_VALID") {
        throw AppError.badRequest("DATA_ARE_NOT_VALID");
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        throw AppError.badRequest("EMAIL_ALREADY_EXISTS");
      }

      throw error;
    }
  },

  async ownerRegister(request: FastifyRequest, reply: FastifyReply) {
    const dto = ownerRegisterSchema.parse(request.body);

    try {
      const result = await authService.registerOwner(dto);
      return reply.status(201).send(result);
    } catch (error: any) {
      if (error.message === "DATA_ARE_NOT_VALID") {
        throw AppError.badRequest("DATA_ARE_NOT_VALID");
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        throw AppError.badRequest("EMAIL_ALREADY_EXISTS");
      }

      if (error.message === "INVALID_MAP_URL") {
        throw AppError.badRequest("INVALID_MAP_URL");
      }

      throw error;
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = loginSchema.parse(request.body);

    try {
      const user = await authService.login(dto);

      const accessToken = signAccessToken({
        sub: user.id,
        role: user.role,
      });

      const refreshToken = signRefreshToken({
        sub: user.id,
      });

      reply
        .setCookie("access_token", accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 15,
        })
        .setCookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

      return reply.status(200).send({
        role: user.role,
      });
    } catch (error: any) {
      if (error.message === "INVALID_EMAIL_OR_PASSWORD") {
        throw AppError.badRequest("INVALID_EMAIL_OR_PASSWORD");
      }

      if (error.message === "EMAIL_NOT_FOUND") {
        throw AppError.notFound("EMAIL_NOT_FOUND");
      }

      throw error;
    }
  },

  async loginWithQr(request: FastifyRequest, reply: FastifyReply) {
    const dto = loginWithQrSchema.parse(request.body);

    try {
      const user = await authService.loginWithQr(dto);

      const accessToken = signAccessToken({
        sub: user.id,
        role: user.role,
      });

      const refreshToken = signRefreshToken({
        sub: user.id,
      });

      reply
        .setCookie("access_token", accessToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 15,
        })
        .setCookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24,
        });

      return reply.status(200).send({
        role: user.role,
      });
    } catch (error: any) {
      if (
        error.message === "INVALID_QR_TOKEN" ||
        error.message === "QR_NOT_ACTIVE"
      ) {
        throw AppError.badRequest("INVALID_OR_EXPIRED_QR_CODE");
      }

      if (error.message === "USER_NOT_FOUND_FOR_ROOM") {
        throw AppError.notFound("USER_NOT_FOUND_FOR_THIS_ROOM");
      }

      throw error;
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("access_token").clearCookie("refresh_token").send({
      ok: true,
    });
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = forgotPasswordSchema.parse(request.body);

    try {
      await authService.requestPasswordReset(email);

      return reply.send({
        ok: true,
        message: "กรุณาตรวจสอบอีเมลของคุณ",
      });
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        throw AppError.notFound("USER_NOT_FOUND");
      }

      throw error;
    }
  },

  async verifyResetToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = verifyResetTokenSchema.parse(request.body);

    try {
      await authService.verifyTokenValidity(token);

      return reply.send({
        ok: true,
      });
    } catch (error: any) {
      if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
        throw AppError.badRequest("INVALID_OR_EXPIRED_TOKEN");
      }

      throw error;
    }
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, newPassword } = resetPasswordSchema.parse(request.body);

    try {
      await authService.resetPassword(token, newPassword);

      return reply.send({
        ok: true,
      });
    } catch (error: any) {
      if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
        throw AppError.badRequest("INVALID_OR_EXPIRED_TOKEN");
      }

      throw error;
    }
  },
};
