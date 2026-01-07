import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import logger from "@/utils/logger";
import { Role } from "@/types/role.type";
const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

function getToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return request.cookies?.access_token;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = getToken(request);

  if (!token) {
    logger.warn({
      msg: "Token not found",
      path: request.url,
      method: request.method,
      ip: request.ip,
      ua: request.headers["user-agent"],
    });

    return reply.status(401).send({
      code: "UNAUTHORIZED",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      role: Role;
      iat: number;
      exp: number;
    };

    request.user = payload;
  } catch (error: any) {
    logger.error(error);

    return reply.status(401).send({
      code: "INVALID_TOKEN",
    });
  }
}

export function authRoleMiddleware(allowedRoles: Role[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user) {
      return reply.status(401).send({
        code: "UNAUTHORIZED",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({
        code: "FORBIDDEN",
      });
    }
  };
}
