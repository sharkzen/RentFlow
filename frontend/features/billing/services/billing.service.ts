import { axios } from "@/lib/api/api-client";
import {
  BillingOrder,
  CouponPreview,
  CreateOrderPayload,
  MyBilling,
  OrderDetail,
  Plan,
} from "../types";

export const BillingService = {
  getPlans: async (): Promise<Plan[]> => {
    const res = await axios.get("/api/billing/plans");
    return res.data.data;
  },

  getMyBilling: async (): Promise<MyBilling> => {
    const res = await axios.get("/api/billing/me");
    return res.data.data;
  },

  previewCoupon: async (payload: {
    code: string;
    type: "PLAN" | "PROMOTION";
    planId?: string;
    months: number;
  }): Promise<CouponPreview> => {
    const res = await axios.post("/api/billing/coupons/preview", payload);
    return res.data.data;
  },

  claimTrial: async () => {
    const res = await axios.post("/api/billing/trial");
    return res.data.data;
  },

  getOrders: async (): Promise<BillingOrder[]> => {
    const res = await axios.get("/api/billing/orders");
    return res.data.data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<BillingOrder> => {
    const res = await axios.post("/api/billing/orders", payload);
    return res.data.data;
  },

  getOrder: async (id: string): Promise<OrderDetail> => {
    const res = await axios.get(`/api/billing/orders/${id}`);
    return res.data.data;
  },

  cancelOrder: async (id: string) => {
    const res = await axios.post(`/api/billing/orders/${id}/cancel`);
    return res.data;
  },

  uploadSlip: async (
    id: string,
    file: File,
  ): Promise<{ status: "PAID" | "PENDING_REVIEW" }> => {
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post(`/api/billing/orders/${id}/slip`, form);
    return res.data.data;
  },
};
