import { axios } from "@/lib/api-client";
export const RoomService = {
  getRoomsByDormitory: async (
    dormId: string,
    params?: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const response = await axios.get(`/api/rooms/${dormId}`, {
      params: params,
    });
    return response.data;
  },
};
