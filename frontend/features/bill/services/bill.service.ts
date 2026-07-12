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

  updateBillItem: async (
    billId: string,
    billItemId: string,
    data: {
      name: string;
      amount: number;
      type: "CHARGE" | "DISCOUNT";
    },
  ) => {
    const res = await axios.patch(
      `/api/bills/${billId}/items/${billItemId}`,
      data,
    );
    return res.data;
  },

  deleteBillItem: async (billId: string, billItemId: string) => {
    const res = await axios.delete(`/api/bills/${billId}/items/${billItemId}`);
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

  addBillItem: async (
    billId: string,
    data: {
      name: string;
      amount: number;
      type: "CHARGE" | "DISCOUNT";
    },
  ) => {
    const res = await axios.post(`/api/bills/${billId}/items`, data);
    return res.data;
  },

  applyAdvancePayment: async (billId: string) => {
    const res = await axios.post(`/api/bills/${billId}/apply-advance-payment`);
    return res.data;
  },
  rejectBill: async (billId: string) => {
    const res = await axios.post(`/api/bills/${billId}/reject`);
    return res.data;
  },

  deleteBill: async (billId: string) => {
    const res = await axios.delete(`/api/bills/${billId}`);
    return res.data;
  },

  getDrafts: async (dormId: string) => {
    const res = await axios.get(`/api/bills/${dormId}/drafts`);
    return res.data;
  },

  saveDraft: async (data: {
    dormId: string;
    name: string;
    selectedDate: string;
    items: any[];
  }) => {
    const res = await axios.post(`/api/bills/drafts`, data);
    return res.data;
  },

  deleteDraft: async (draftId: string) => {
    const res = await axios.delete(`/api/bills/drafts/${draftId}`);
    return res.data;
  },

  uploadTempImage: async (data: FormData) => {
    const res = await axios.post(`/api/bills/upload-temp`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  deleteTempImage: async (objectKey: string) => {
    const res = await axios.delete(`/api/bills/upload-temp`, {
      params: {
        objectKey,
      },
    });

    return res.data;
  },

  sendBillEmails: async (billIds: string[]) => {
    const res = await axios.post(`/api/bills/send-emails`, {
      billIds,
    });

    return res.data;
  },
};
