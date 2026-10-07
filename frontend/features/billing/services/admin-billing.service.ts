import { axios } from "@/lib/api/api-client";
import {
  AdminOrder,
  BillingSettings,
  Coupon,
  CouponPayload,
  OwnerSubscriptionAction,
  OwnerSubscriptionInfo,
  Paginated,
  Plan,
  PlanPayload,
  RevenueReport,
} from "../types";

export const AdminBillingService = {
  getPlans: async (): Promise<Plan[]> => {
    const res = await axios.get("/api/admin/billing/plans");
    return res.data.data;
  },

  createPlan: async (payload: PlanPayload) => {
    const res = await axios.post("/api/admin/billing/plans", payload);
    return res.data;
  },

  updatePlan: async (id: string, payload: PlanPayload) => {
    const res = await axios.put(`/api/admin/billing/plans/${id}`, payload);
    return res.data;
  },

  deletePlan: async (id: string): Promise<{ deactivated: boolean }> => {
    const res = await axios.delete(`/api/admin/billing/plans/${id}`);
    return res.data;
  },

  grantTrialToExistingOwners: async (): Promise<{
    granted: number;
    candidates: number;
  }> => {
    const res = await axios.post("/api/admin/billing/grant-trial");
    return res.data.data;
  },

  getReport: async (months = 12): Promise<RevenueReport> => {
    const res = await axios.get("/api/admin/billing/report", {
      params: { months },
    });
    return res.data.data;
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const res = await axios.get("/api/admin/billing/coupons");
    return res.data.data;
  },

  createCoupon: async (payload: CouponPayload) => {
    const res = await axios.post("/api/admin/billing/coupons", payload);
    return res.data;
  },

  updateCoupon: async (id: string, payload: CouponPayload) => {
    const res = await axios.put(`/api/admin/billing/coupons/${id}`, payload);
    return res.data;
  },

  deleteCoupon: async (id: string): Promise<{ deactivated: boolean }> => {
    const res = await axios.delete(`/api/admin/billing/coupons/${id}`);
    return res.data;
  },

  getOrders: async (params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<Paginated<AdminOrder>> => {
    const res = await axios.get("/api/admin/billing/orders", { params });
    return res.data;
  },

  getOrderSlips: async (id: string): Promise<string[]> => {
    const res = await axios.get(`/api/admin/billing/orders/${id}/slips`);
    return res.data.data;
  },

  reviewOrder: async (
    id: string,
    action: "APPROVE" | "REJECT",
    note?: string,
  ) => {
    const res = await axios.post(`/api/admin/billing/orders/${id}/review`, {
      action,
      note: note || undefined,
    });
    return res.data;
  },

  /** บันทึกว่าคืนเงินแล้ว (แอดมินโอนคืนเอง) ระบบจะยกเลิกสิทธิ์ที่ได้จากคำสั่งซื้อนั้น */
  refundOrder: async (id: string, note: string) => {
    const res = await axios.post(`/api/admin/billing/orders/${id}/refund`, {
      note,
    });
    return res.data;
  },

  getOwnerSubscription: async (
    ownerId: string,
  ): Promise<OwnerSubscriptionInfo> => {
    const res = await axios.get(
      `/api/admin/billing/owners/${ownerId}/subscription`,
    );
    return res.data.data;
  },

  updateOwnerSubscription: async (
    ownerId: string,
    payload: OwnerSubscriptionAction,
  ) => {
    const res = await axios.post(
      `/api/admin/billing/owners/${ownerId}/subscription`,
      payload,
    );
    return res.data;
  },

  cancelPromotion: async (promotionId: string, reason: string) => {
    const res = await axios.post(
      `/api/admin/billing/promotions/${promotionId}/cancel`,
      { reason },
    );
    return res.data;
  },

  getSettings: async (): Promise<BillingSettings> => {
    const res = await axios.get("/api/admin/billing/settings");
    return res.data.data;
  },

  updateSettings: async (
    payload: Partial<BillingSettings>,
  ): Promise<BillingSettings> => {
    const res = await axios.put("/api/admin/billing/settings", payload);
    return res.data.data;
  },
};
