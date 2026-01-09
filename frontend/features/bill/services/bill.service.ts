import { axios } from "@/lib/api-client";

export interface Bill {
  id: string;
  roomNumberSnapshot: string;
  tenantNameSnapshot: string;
  billingMonth: string;
  total: number;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  waterUnitSnapshot: number;
  electricUnitSnapshot: number;
}

export const BillService = {
  getBills: async (dormId: string, params: any) => {
    const res = await axios.get(`/api/bills/${dormId}`, {
      params,
    });

    return res.data;
  },

  createBills: async (data: {
    dormId: string;
    billingMonth: Date;
    items: any[];
  }) => {
    const res = await axios.post(`/api/bills`, data);
    return res.data;
  },

  updateStatus: async (billId: string, status: string) => {
    const res = await axios.patch(`/api/bills/${billId}/status`, {
      status,
    });

    return res.data;
  },

  uploadSlip: async (billId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(`/api/bills/${billId}/upload-slip`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
