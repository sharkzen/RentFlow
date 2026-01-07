import { axios } from "@/lib/api-client";
import { GetTenantDormParams } from "../types";

export const TenantService = {
  getTenantDorm: async ({
    dormId,
    page = 1,
    limit = 10,
    search,
  }: GetTenantDormParams) => {
    const res = await axios.get(`/api/tenants/${dormId}`, {
      params: {
        page,
        limit,
        search,
      },
    });

    return res.data;
  },
  createTenant: async (data: any) => {
    const res = await axios.post(`/api/tenants`, data);
    return res.data;
  },
};
