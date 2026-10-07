import { axios } from "@/lib/api/api-client";
import { BillingSettings, Plan, PlanPayload } from "../types";

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
