import {
  authMiddleware,
  authRoleMiddleware,
} from "@/middleware/auth.middleware";
import { Role } from "@/types/role.type";
import { FastifyInstance } from "fastify";
import { BillController } from "@/modules/bill/bill.controller";

export async function billRoute(app: FastifyInstance) {
  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.OWNER, Role.ADMIN]),
    );
    routeRoles.post("/send-emails", BillController.sendBillEmails);
    routeRoles.get("/:dormId", BillController.getBills);
    routeRoles.post("/", BillController.createBills);
    routeRoles.patch("/:billId/status", BillController.updateStatus);
    routeRoles.delete("/:billId", BillController.deleteBill);
    routeRoles.post("/:billId/items", BillController.addBillItem);
    routeRoles.delete("/:billId/items/:itemId", BillController.deleteBillItem);
    routeRoles.patch("/:billId/items/:itemId", BillController.updateBillItem);
    routeRoles.post(
      "/:billId/apply-advance-payment",
      BillController.applyAdvancePayment,
    );
    routeRoles.post("/:billId/reject", BillController.rejectBill);
    routeRoles.get("/:dormId/drafts", BillController.getDrafts);
    routeRoles.post("/drafts", BillController.saveDraft);
    routeRoles.delete("/drafts/:draftId", BillController.deleteDraft);
    routeRoles.post("/upload-temp", BillController.uploadTempImage);
    routeRoles.delete("/upload-temp", BillController.deleteTempImage);
    routeRoles.post("/ocr", BillController.scanMeter);
    routeRoles.post("/generate-pdf", BillController.generatePdf);
  });

  app.register(async (routeRoles) => {
    routeRoles.addHook("preHandler", authMiddleware);
    routeRoles.addHook(
      "preHandler",
      authRoleMiddleware([Role.TENANT, Role.OWNER]),
    );
    routeRoles.post("/:billId/upload-slip", BillController.uploadSlip);
  });
}
