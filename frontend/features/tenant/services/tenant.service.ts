import { axios } from "@/lib/api/api-client";

import {
  BillsResponse,
  GetMyBillsParams,
  GetTenantDormParams,
  MaintenanceRequest,
  TenantDashboardData,
} from "../types";

import {
  BillData,
  BillStatus,
  IBillDetail,
} from "@/features/bill/components/tenant/types";

export interface GetMaintenanceParams {
  page?: number;
  limit?: number;
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

  moveOut: async (
    tenantId: string,
    data: {
      moveOutDate: string;
    },
  ) => {
    const response = await axios.post(
      `/api/tenants/${tenantId}/move-out`,
      data,
    );
    return response.data;
  },

  cancelMoveOut: async (tenantId: string) => {
    const response = await axios.post(
      `/api/tenants/${tenantId}/cancel-move-out`,
    );
    return response.data;
  },

  getDashboard: async (): Promise<TenantDashboardData> => {
    const res = await axios.get(`/api/tenants/dashboard`);
    return res.data;
  },

  getMyBills: async (params?: GetMyBillsParams) => {
    const finalParams: Record<string, any> = {};

    if (params?.page) finalParams.page = params.page;

    if (params?.limit) finalParams.limit = params.limit;

    if (params?.year) finalParams.year = params.year;

    if (params?.status && params.status !== "ALL") {
      finalParams.status = params.status;
    }

    if (params?.month && params.month !== "ALL") {
      finalParams.month = params.month;
    }

    const res = await axios.get<BillsResponse>(`/api/tenants/bills`, {
      params: finalParams,
    });

    return res.data;
  },

  getBillDetail: async (billId: string): Promise<IBillDetail> => {
    const res = await axios.get(`/api/tenants/bills/${billId}`);
    return res.data;
  },

  generatePromptPayQR: async (billId: string) => {
    const res = await axios.post(`/api/tenants/payment/generate-qr`, {
      billId,
    });

    return res.data;
  },

  printBillTenant: async (billId: string) => {
    const res = await axios.get(`/api/tenants/bills/${billId}/print`, {
      responseType: "blob",
    });

    return res.data;
  },

  uploadPaymentSlip: async (
    billId: string,
    file: File,
    refNo: string | null,
  ) => {
    const formData = new FormData();
    formData.append("billId", billId);

    if (refNo) {
      formData.append("refNo", refNo);
    }

    formData.append("file", file);
    const res = await axios.post(`/api/tenants/payment/upload-slip`, formData);
    return res.data;
  },

  createMaintenance: async (formData: FormData) => {
    const res = await axios.post("/api/tenants/maintenance", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  getMyMaintenances: async (params?: GetMaintenanceParams) => {
    const res = await axios.get("/api/tenants/maintenance/history", {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
    });

    return res.data;
  },

  updateMaintenance: async (id: string, formData: FormData) => {
    const res = await axios.patch(`/api/tenants/maintenance/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  cancelMaintenance: async (id: string) => {
    const res = await axios.delete(`/api/tenants/maintenance/${id}`);
    return res.data;
  },

  getMaintenanceMessages: async (id: string) => {
    const res = await axios.get(`/api/tenants/maintenance/${id}/messages`);
    return res.data;
  },

  sendMaintenanceMessage: async (id: string, message: string) => {
    const res = await axios.post(`/api/tenants/maintenance/${id}/messages`, {
      message,
    });

    return res.data;
  },

  editMaintenanceMessage: async (
    id: string,
    messageId: string,
    message: string,
  ) => {
    const res = await axios.patch(
      `/api/tenants/maintenance/${id}/messages/${messageId}`,
      { message },
    );

    return res.data;
  },

  getContractDetail: async () => {
    const response = await axios.get(`/api/tenants/contract`);
    return response.data;
  },

  reEntryTenant: async (data: any) => {
    const response = await axios.post("/api/tenants/re-entry", data);
    return response.data;
  },
};
