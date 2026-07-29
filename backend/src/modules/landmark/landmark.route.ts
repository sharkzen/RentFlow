import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import {
  LandmarkController,
  createLandmarkSchema,
} from "@/modules/landmark/landmark.controller";
import {
  zodBody,
  okArrayResponse,
  okResponse,
  commonErrorResponses,
} from "@/config/swagger";

export async function landmarkRoute(app: FastifyInstance) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Landmark (Public)"],
        summary: "รายการสถานที่สำคัญทั้งหมด (สำหรับค้นหาหอพักใกล้สถานที่)",

        response: {
          200: okArrayResponse("รายการสถานที่สำคัญ", {
            id: {
              type: "string",
            },

            name: {
              type: "string",
            },

            slug: {
              type: "string",
            },

            type: {
              type: "string",
            },

            latitude: {
              type: "number",
            },

            longitude: {
              type: "number",
            },
          }),
        },
      },
    },
    LandmarkController.getAllLandmarks,
  );

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));

    routeRoles.post(
      "/",
      {
        schema: {
          tags: ["Landmark (Admin)"],
          summary: "สร้างสถานที่สำคัญใหม่ (ดึงพิกัดจากลิงก์ Google Maps)",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createLandmarkSchema),

          response: {
            201: okResponse("สร้างสถานที่สำคัญสำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      LandmarkController.createLandmark,
    );
  });
}
