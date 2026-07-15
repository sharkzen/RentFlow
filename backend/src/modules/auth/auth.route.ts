import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { AuthController } from "@/modules/auth/auth.controller";

export async function authRoute(app: FastifyInstance) {
  app.post("/register-admin", AuthController.register);
  app.post("/register-owner", AuthController.ownerRegister);
  app.post("/refresh", AuthController.refresh);
  app.post("/login", AuthController.login);
  app.post("/logout", AuthController.logout);
  app.post("/login/qr", AuthController.loginWithQr);
  app.post("/forgot-password", AuthController.forgotPassword);
  app.post("/reset-password", AuthController.resetPassword);
  app.post("/verify-reset-token", AuthController.verifyResetToken);

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER, Role.TENANT]),
    );
    routeRoles.get("/me", AuthController.me);
  });
}
