import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { AuthController } from "@/modules/auth/auth.controller";

const bruteForceRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};

export async function authRoute(app: FastifyInstance) {
  app.post("/register-admin", bruteForceRateLimit, AuthController.register);
  app.post(
    "/register-owner",
    bruteForceRateLimit,
    AuthController.ownerRegister,
  );
  app.post("/refresh", AuthController.refresh);
  app.post("/login", bruteForceRateLimit, AuthController.login);
  app.post("/logout", AuthController.logout);
  app.post("/login/qr", bruteForceRateLimit, AuthController.loginWithQr);
  app.post(
    "/forgot-password",
    bruteForceRateLimit,
    AuthController.forgotPassword,
  );
  app.post(
    "/reset-password",
    bruteForceRateLimit,
    AuthController.resetPassword,
  );
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
