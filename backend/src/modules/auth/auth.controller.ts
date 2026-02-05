import { FastifyRequest, FastifyReply } from "fastify";
import {
  AdminRegisterDto,
  OwnerRegisterDto,
} from "@/modules/auth/dto/register.dto";
import { authService } from "@/modules/auth/auth.service";
import { signAccessToken, signRefreshToken } from "@/utils/jwt";
import logger from "@/utils/logger";
import { LoginDto } from "@/modules/auth/dto/login.dto";

export const AuthController = {
  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    try {
      if (!user) {
        return reply.status(401).send({
          message: "UNAUTHORIZED",
        });
      }

      const me = await authService.me(user);

      const { password, ...rest } = me;

      reply.send(rest);
    } catch (error: any) {
      logger.error(error.message);

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = request.cookies.refresh_token;

      if (!token) {
        return reply.status(401).send({
          message: "UNAUTHORIZED",
        });
      }

      const accessToken = await authService.refreshAccessToken(token);

      reply.setCookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      });

      reply.send({
        ok: true,
      });
    } catch {
      reply.status(401).send({
        message: "UNAUTHORIZED",
      });
    }
  },

  async register(request: FastifyRequest, reply: FastifyReply) {
    const dto = request.body as AdminRegisterDto;

    try {
      const user = await authService.registerAdmin(dto);
      reply.status(201).send(user);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "DATA_ARE_NOT_VALID") {
        return reply.status(400).send({
          message: "DATA_ARE_NOT_VALID",
        });
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return reply.status(400).send({
          message: "EMAIL_ALREADY_EXISTS",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async ownerRegister(request: FastifyRequest, reply: FastifyReply) {
    const dto = request.body as OwnerRegisterDto;

    try {
      const result = await authService.registerOwner(dto);
      return reply.status(201).send(result);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "DATA_ARE_NOT_VALID") {
        return reply.status(400).send({
          message: "DATA_ARE_NOT_VALID",
        });
      }

      if (error.message === "EMAIL_ALREADY_EXISTS") {
        return reply.status(400).send({
          message: "EMAIL_ALREADY_EXISTS",
        });
      }

      if (error.message === "INVALID_MAP_URL") {
        return reply.status(400).send({
          message: "INVALID_MAP_URL",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const dto = request.body as LoginDto;

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
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 15,
        })
        .setCookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

      return reply.status(200).send({
        role: user.role,
      });
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "INVALID_EMAIL_OR_PASSWORD") {
        return reply.status(400).send({
          message: "INVALID_EMAIL_OR_PASSWORD",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("access_token").clearCookie("refresh_token").send({
      ok: true,
    });
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const { email } = request.body as {
      email: string;
    };

    try {
      if (!email) throw new Error("DATA_ARE_NOT_VALID");

      await authService.requestPasswordReset(email);

      return reply.send({
        ok: true,
        message: "กรุณาตรวจสอบอีเมลของคุณ",
      });
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "USER_NOT_FOUND") {
        return reply.status(404).send({
          message: "USER_NOT_FOUND",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async verifyResetToken(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.body as {
      token: string;
    };

    try {
      if (!token) throw new Error("DATA_ARE_NOT_VALID");

      await authService.verifyTokenValidity(token);

      return reply.send({
        ok: true,
      });
    } catch (error: any) {
      if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
        return reply.status(400).send({
          message: "INVALID_OR_EXPIRED_TOKEN",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const { token, newPassword } = request.body as any;

    try {
      if (!token || !newPassword) throw new Error("DATA_ARE_NOT_VALID");

      await authService.resetPassword(token, newPassword);

      return reply.send({
        ok: true,
      });
    } catch (error: any) {
      logger.error(error.message);

      if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
        return reply.status(400).send({
          message: "INVALID_OR_EXPIRED_TOKEN",
        });
      }

      return reply.status(500).send({
        message: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
