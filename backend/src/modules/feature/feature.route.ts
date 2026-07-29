import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import {
  featureController,
  createFeatureSchema,
  updateFeatureSchema,
} from "@/modules/feature/feature.controller";
import { zodBody, okResponse, commonErrorResponses } from "@/config/swagger";

const keyParam = {
  type: "object",

  properties: {
    key: {
      type: "string",
    },
  },

  required: ["key"],
};

export async function featureRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.ADMIN, Role.OWNER]),
    );

    routeRoles.get(
      "/:key",
      {
        schema: {
          tags: ["Feature Flags (Owner/Admin read)"],
          summary: "ตรวจสอบสถานะ feature flag ด้วย key",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: keyParam,

          response: {
            200: okResponse("สถานะ feature flag"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      featureController.getFeature,
    );
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook("preHandler", authRoleMiddleware([Role.ADMIN]));

    routeRoles.get(
      "/all",
      {
        schema: {
          tags: ["Feature Flags (Admin)"],
          summary: "รายการ feature flag ทั้งหมด",

          security: [
            {
              bearerAuth: [],
            },
          ],

          response: {
            200: okResponse("รายการ feature flag", {
              success: {
                type: "boolean",
              },

              data: {
                type: "array",

                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
            }),

            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
          },
        },
      },
      featureController.getAllFeatures,
    );

    routeRoles.post(
      "/",
      {
        schema: {
          tags: ["Feature Flags (Admin)"],
          summary: "สร้าง feature flag ใหม่",

          security: [
            {
              bearerAuth: [],
            },
          ],

          body: zodBody(createFeatureSchema),

          response: {
            201: okResponse("สร้าง feature flag สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            409: commonErrorResponses[409],
          },
        },
      },
      featureController.createFeature,
    );

    routeRoles.patch(
      "/:key",
      {
        schema: {
          tags: ["Feature Flags (Admin)"],
          summary: "แก้ไข feature flag",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: keyParam,
          body: zodBody(updateFeatureSchema),

          response: {
            200: okResponse("แก้ไข feature flag สำเร็จ"),
            400: commonErrorResponses[400],
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      featureController.updateFeature,
    );

    routeRoles.delete(
      "/:key",
      {
        schema: {
          tags: ["Feature Flags (Admin)"],
          summary: "ลบ feature flag",

          security: [
            {
              bearerAuth: [],
            },
          ],

          params: keyParam,

          response: {
            200: okResponse("ลบ feature flag สำเร็จ"),
            401: commonErrorResponses[401],
            403: commonErrorResponses[403],
            404: commonErrorResponses[404],
          },
        },
      },
      featureController.deleteFeature,
    );
  });
}
