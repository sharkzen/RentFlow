import { axios } from "@/lib/api-client";
import { DormitoryImage } from "@/features/dormitory";
import { DormFormData } from "@/features/dormitory";
export const DormService = {
  getOverview: async (dormId: string) => {
    const res = await axios.get(`/api/dorms/${dormId}/overview`);
    return res.data;
  },
  createDrom: async (name: string) => {
    const res = await axios.post(`/api/dorms`, name);
    return res.data;
  },
  getDorm: async () => {
    const res = await axios.get(`/api/dorms`);
    return res.data;
  },
  updateDorm: async (data: DormFormData) => {
    const res = await axios.put(`/api/dorms`, data);
    return res.data;
  },
  updateDormStatus: async (dormId: string, isPublished: boolean) => {
    const res = await axios.patch(`/api/dorms/${dormId}/status`, {
      isPublished,
    });
    return res.data;
  },

  uploadImage: async (dormId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(`/api/dorms/${dormId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
  getDormImages: async (dormId: string) => {
    const res = await fetch(`/api/dorms/${dormId}/images`);
    if (!res.ok) throw new Error("Failed to fetch images");
    const data = await res.json();
    return data as DormitoryImage[];
  },

  deleteImage: async (imageId: string) => {
    const res = await axios.delete(`/api/dorms/image/${imageId}`);
    return res.data;
  },

  updateImageOrder: async (
    dormId: string,
    images: { id: string; order: number }[],
  ) => {
    const res = await axios.put(`/api/dorms/${dormId}/images/order`, {
      images,
    });
    return res.data;
  },
};
