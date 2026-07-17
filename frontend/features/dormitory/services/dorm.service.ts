import { axios } from "@/lib/api/api-client";
import { DormitoryImage, PaginationResponse } from "@/features/dormitory";
import { DormFormData } from "@/features/dormitory";

export const DormService = {
  getAllDroms: async (
    params?: Record<string, any>,
  ): Promise<PaginationResponse<any>> => {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    const response = await axios.get(`/api/dorms/all${queryString}`);
    return response.data;
  },

  getDormBySlug: async (slug: string) => {
    const res = await axios.get(`/api/dorms/${encodeURIComponent(slug)}`);
    return res.data;
  },

  getDashboard: async (
    dormId: string,
    month?: string | number,
    year?: string | number,
  ) => {
    const res = await axios.get(`/api/dorms/${dormId}/dashboard`, {
      params: {
        month,
        year,
      },
    });

    return res.data;
  },

  createDrom: async (name: string) => {
    const res = await axios.post(`/api/dorms`, {
      name,
    });

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

  uploadImages: async (dormId: string, files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await axios.post(`/api/dorms/${dormId}/upload`, formData);
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
    images: {
      id: string;
      order: number;
    }[],
  ) => {
    const res = await axios.put(`/api/dorms/${dormId}/images/order`, {
      images,
    });

    return res.data;
  },

  deleteDorm: async (dormId: string) => {
    const res = await axios.delete(`/api/dorms/${dormId}`);
    return res.data;
  },
};
