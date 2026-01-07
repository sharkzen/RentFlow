import { axios } from "@/lib/api-client";
import { CreateBulkRoomsDto } from "../types";

export const RoomService = {
  getRoomsByDormitory: async (
    dormId: string,
    params?: {
      search?: string;
      status?: string;
      type?: string;
      floor?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const response = await axios.get(`/api/rooms/${dormId}`, {
      params: params,
    });

    return response.data;
  },

  createBulkRooms: async (payload: CreateBulkRoomsDto) => {
    const response = await axios.post(`/api/rooms/bulk`, payload);
    return response.data;
  },

  updateRoom: async (roomId: string, payload: any) => {
    const response = await axios.patch(`/api/rooms/${roomId}`, payload);
    return response.data;
  },
};
