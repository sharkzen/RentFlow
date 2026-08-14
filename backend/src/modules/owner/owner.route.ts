import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { OwnerController } from "./owner.controller";
import { updateOwnerSchema } from "@/modules/owner/validators/owner.validator";
import { zodBody, okResponse, commonErrorResponses } from "@/config/swagger";

export async function ownerRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.OWNER]));

    routeRoles.get(
      "/",
      {
        schema: {
          tags: ["Owner Profile (Owner)"],
          summary: "ดูข้อมูลโปรไฟล์เจ้าของหอพักที่ login อยู่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("ข้อมูลโปรไฟล์เจ้าของหอพัก"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      OwnerController.getOwnerInfo,
    );

    routeRoles.patch(
      "/",
      {
        schema: {
          tags: ["Owner Profile (Owner)"],
          summary: "แก้ไขข้อมูลโปรไฟล์เจ้าของหอพัก",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(updateOwnerSchema),

          response: {
            200: okResponse("แก้ไขข้อมูลโปรไฟล์สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      OwnerController.updateOwnerInfo,
    );
  });
}
