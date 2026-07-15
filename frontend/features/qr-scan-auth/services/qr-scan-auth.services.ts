import { axios } from "@/lib/api-client";

export const QrScanAuthService = {
  createOrRenewQr: async (roomId: string) => {
    const response = await axios.post(
      `/api/rooms/${roomId}/qr-auth`,
      {},
      {
        responseType: "blob",
      },
    );

    return response.data;
  },

  generateBulkPdf: async (roomIds: string[]) => {
    const response = await axios.post(
      `/api/rooms/qr-auth/bulk-pdf`,
      {
        roomIds,
      },
      {
        responseType: "blob",
      },
    );

    return response.data;
  },

  toggleStatus: async (roomId: string, isActive: boolean) => {
    const response = await axios.patch(`/api/rooms/${roomId}/qr-auth/status`, {
      isActive,
    });

    return response.data;
  },

  verifyAndLogin: async (token: string) => {
    const response = await axios.post(`/api/auth/qr-login`, {
      token,
    });

    return response.data;
  },
};
