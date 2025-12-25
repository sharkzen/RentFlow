import { Role } from "@/types/role.type";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      role: Role;
      iat: number;
      exp: number;
    };
  }
}
