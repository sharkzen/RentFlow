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
};
