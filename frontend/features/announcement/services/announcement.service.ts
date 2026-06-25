import { axios } from "@/lib/api-client";

export const AnnouncementService = {
  ownerGetAnnouncements: async (params: {
    dormitoryId: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await axios.get("/api/announcements/owner", {
      params,
    });

    return res.data;
  },

  tenantGetAnnouncements: async (params?: {
    dormitoryId?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await axios.get("/api/announcements/tenant", {
      params,
    });

    return res.data;
  },

  tenantMarkAsRead: async (id: string) => {
    const res = await axios.post(`/api/announcements/tenant/${id}/read`);
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

  togglePinAnnouncement: async (id: string) => {
    const res = await axios.patch(`/api/announcements/${id}/pin`);
    return res.data;
  },

  reorderAnnouncements: async (
    items: {
      id: string;
      order: number;
    }[],
  ) => {
    const res = await axios.put(`/api/announcements/reorder`, {
      items,
    });

    return res.data;
  },

  update: async (id: string, formData: FormData) => {
    const res = await axios.put(`/api/announcements/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  delete: async (id: string) => {
    const res = await axios.delete(`/api/announcements/${id}`);
    return res.data;
  },

  deleteImage: async (imageId: string) => {
    const res = await axios.delete(`/api/announcements/image/${imageId}`);
    return res.data;
  },
};
