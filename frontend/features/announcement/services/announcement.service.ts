import { axios } from "@/lib/api-client";

export const AnnouncementService = {
  ownerGetAnnouncements: async (params: {
    dormitoryId: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await axios.get("/api/announcements/owner", { params });
    return res.data;
  },

  tenantGetAnnouncements: async (params: {
    dormitoryId: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await axios.get("/api/announcements/tenant", { params });
    return res.data;
  },

  createAnnouncement: async (formData: FormData) => {
    const res = await axios.post("/api/announcements", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
