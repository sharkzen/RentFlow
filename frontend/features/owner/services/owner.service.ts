import { axios } from "@/lib/api/api-client";
import { OwnerProfile } from "@/features/owner/types";

export const OwnerService = {
  getOwnerProfile: async () => {
    const res = await axios.get("/api/owners");
    return res.data;
  },

  updateOwnerProfile: async (data: OwnerProfile) => {
    const res = await axios.patch("/api/owners", data);
    return res.data;
  },
};
