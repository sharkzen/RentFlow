import { axios } from "@/lib/api-client";

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
};
