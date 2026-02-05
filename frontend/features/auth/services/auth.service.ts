import { axios } from "@/lib/api-client";
import type {
  OwnerRegisterFormData,
  LoginPayload,
} from "@/features/auth/types";

export const authService = {
  getMe: async () => {
    const res = await axios.get("/api/auth/me");
    return res.data;
  },

  registerOwner: async (data: OwnerRegisterFormData) => {
    const res = await axios.post("/api/auth/register-owner", data);
    return res.data;
  },

  login: async (data: LoginPayload) => {
    const res = await axios.post("/api/auth/login", data);
    return res.data;
  },

  logout: async () => {
    const res = await axios.post("/api/auth/logout");
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await axios.post("/api/auth/forgot-password", {
      email,
    });

    return res.data;
  },

  verifyResetToken: async (token: string) => {
    const res = await axios.post("/api/auth/verify-reset-token", {
      token,
    });

    return res.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const res = await axios.post("/api/auth/reset-password", {
      token,
      newPassword,
    });

    return res.data;
  },
};
