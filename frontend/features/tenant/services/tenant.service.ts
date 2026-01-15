import { axios } from "@/lib/api-client";
import { TenantDashboardData } from "../types";

interface GetTenantDormParams {
  dormId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const TenantService = {
  getTenantDorm: async ({
    dormId,
    page = 1,
    limit = 10,
    search,
    status,
  }: GetTenantDormParams) => {
    const res = await axios.get(`/api/tenants/${dormId}`, {
      params: {
        page,
        limit,
        search,
        status,
      },
    });

    return res.data;
  },

  createTenant: async (data: any) => {
    const res = await axios.post(`/api/tenants`, data);
    return res.data;
  },

  updateTenant: async (tenantId: string, data: any) => {
    const response = await axios.patch(`/api/tenants/${tenantId}`, data);
    return response.data;
  },

  getTenantById: async (tenantId: string) => {
    const response = await axios.get(`/api/tenants/detail/${tenantId}`);
    return response.data;
  },

  moveOut: async (tenantId: string) => {
    const response = await axios.post(`/api/tenants/${tenantId}/move-out`);
    return response.data;
  },

  getDashboard: async (): Promise<Promise<TenantDashboardData>> => {
    const res = await axios.get(`/api/tenants/dashboard`);
    return res.data;
  },

  getMyBills: async (params?: { page?: number; limit?: number }) => {
    const res = await axios.get(`/api/tenants/bills`, {
      params,
    });

    return res.data;
  },

  getBillDetail: async (billId: string) => {
    const res = await axios.get(`/api/tenants/bills/${billId}`);
    return res.data;
  },

  getMyMaintenanceRequests: async () => {
    const res = await axios.get(`/api/tenants/maintenance`);
    return res.data;
  },

  createMaintenanceRequest: async (data: FormData) => {
    const res = await axios.post(`/api/tenants/maintenance`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
