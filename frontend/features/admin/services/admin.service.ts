import { axios } from "@/lib/api-client";

import {
  CreateLandmarkPayload,
  DashboardData,
  Dormitory,
  Landmark,
  OwnerApproval,
  OwnerUser,
  PaginatedResponse,
} from "../types";

export const AdminService = {
  getDashboard: async (): Promise<DashboardData> => {
    const res = await axios.get("/api/admin/dashboard");
    return res.data;
  },

  getPendingList: async (
    page = 1,
    limit = 10,
    search = "",
  ): Promise<PaginatedResponse<OwnerApproval>> => {
    const res = await axios.get("/api/admin/approvals", {
      params: {
        page,
        limit,
        q: search,
      },
    });

    return res.data;
  },

  approveOwner: async (id: string) => {
    const res = await axios.patch(`/api/admin/approvals/${id}/approve`);
    return res.data;
  },

  rejectOwner: async (id: string) => {
    const res = await axios.patch(`/api/admin/approvals/${id}/reject`);
    return res.data;
  },

  getList: async (
    page = 1,
    limit = 10,
    search = "",
    status = "ALL",
    published = "all",
  ): Promise<PaginatedResponse<Dormitory>> => {
    const res = await axios.get("/api/admin/dormitories", {
      params: {
        page,
        limit,
        q: search,
        status,
        published,
      },
    });

    return res.data;
  },

  getDetail: async (id: string): Promise<Dormitory> => {
    const res = await axios.get(`/api/admin/dormitories/${id}`);
    return res.data;
  },

  togglePublish: async (id: string, isPublished: boolean) => {
    const res = await axios.patch(`/api/admin/dormitories/${id}/publish`, {
      isPublished,
    });

    return res.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await axios.patch(`/api/admin/dormitories/${id}/status`, {
      status,
    });

    return res.data;
  },

  getOwners: async (
    page = 1,
    limit = 10,
    search = "",
    status = "ALL",
  ): Promise<PaginatedResponse<OwnerUser>> => {
    const res = await axios.get("/api/admin/users/owners", {
      params: {
        page,
        limit,
        q: search,
        status,
      },
    });

    return res.data;
  },

  getOwnerDetail: async (userId: string): Promise<OwnerUser> => {
    const res = await axios.get(`/api/admin/users/owners/${userId}`);
    return res.data;
  },

  updateUserStatus: async (userId: string, status: string) => {
    const res = await axios.patch(`/api/admin/users/${userId}/status`, {
      status,
    });

    return res.data;
  },

  getLandmarks: async (
    page = 1,
    limit = 10,
    search = "",
    type = "ALL",
  ): Promise<PaginatedResponse<Landmark>> => {
    const res = await axios.get("/api/admin/landmarks", {
      params: {
        page,
        limit,
        q: search,
        type,
      },
    });

    return res.data;
  },

  createLandmark: async (payload: CreateLandmarkPayload) => {
    const res = await axios.post("/api/admin/landmarks", payload);
    return res.data;
  },

  deleteLandmark: async (id: string) => {
    const res = await axios.delete(`/api/admin/landmarks/${id}`);
    return res.data;
  },
};
