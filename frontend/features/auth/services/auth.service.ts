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
};
