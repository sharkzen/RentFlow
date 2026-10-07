import { axios } from "@/lib/api/api-client";

import {
  AdminUser,
  AdminUserDetail,
  CreateLandmarkPayload,
  DashboardData,
  Dormitory,
  Landmark,
  LockedUser,
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

  approveOwner: async (id: string, options: { denyTrial?: boolean } = {}) => {
    const res = await axios.patch(`/api/admin/approvals/${id}/approve`, {
      denyTrial: options.denyTrial ?? false,
    });
    return res.data;
  },

  rejectOwner: async (id: string, reason: string) => {
    const res = await axios.patch(`/api/admin/approvals/${id}/reject`, {
      reason,
    });
    return res.data;
  },

  getList: async (
    page = 1,
    limit = 10,
    search = "",
    status = "ALL",
    published = "all",
    featured = "all",
  ): Promise<PaginatedResponse<Dormitory>> => {
    const res = await axios.get("/api/admin/dormitories", {
      params: {
        page,
        limit,
        q: search,
        status,
        published,
        featured,
      },
    });

    return res.data;
  },

  getFeaturedList: async (): Promise<Dormitory[]> => {
    const res = await axios.get("/api/admin/dormitories/featured");
    return res.data;
  },

  toggleFeatured: async (id: string, isFeatured: boolean) => {
    const res = await axios.patch(`/api/admin/dormitories/${id}/featured`, {
      isFeatured,
    });

    return res.data;
  },

  reorderFeatured: async (
    items: {
      id: string;
      order: number;
    }[],
  ) => {
    const res = await axios.put("/api/admin/dormitories/featured/order", {
      items,
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

  getUsers: async (
    page = 1,
    limit = 15,
    search = "",
    role = "ALL",
    status = "ALL",
  ): Promise<PaginatedResponse<AdminUser>> => {
    const res = await axios.get("/api/admin/users", {
      params: {
        page,
        limit,
        q: search,
        role,
        status,
      },
    });

    return res.data;
  },

  getUserDetail: async (userId: string): Promise<AdminUserDetail> => {
    const res = await axios.get(`/api/admin/users/${userId}`);
    return res.data;
  },

  changeUserPassword: async (userId: string, newPassword: string) => {
    const res = await axios.patch(`/api/admin/users/${userId}/password`, {
      newPassword,
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

  getLockedUsers: async (
    page = 1,
    limit = 15,
    search = "",
    role = "ALL",
  ): Promise<PaginatedResponse<LockedUser>> => {
    const res = await axios.get("/api/admin/users/locked", {
      params: {
        page,
        limit,
        q: search,
        role,
      },
    });

    return res.data;
  },

  unlockUser: async (userId: string) => {
    const res = await axios.patch(`/api/admin/users/${userId}/unlock`);
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

  updateLandmark: async (id: string, payload: CreateLandmarkPayload) => {
    const res = await axios.put(`/api/admin/landmarks/${id}`, payload);
    return res.data;
  },

  deleteLandmark: async (id: string) => {
    const res = await axios.delete(`/api/admin/landmarks/${id}`);
    return res.data;
  },
};
