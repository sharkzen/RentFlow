import { axios } from "@/lib/api/api-client";

export interface Landmark {
  id: string;
  name: string;
  type: string;
}

export const LandmarkService = {
  getAllLandmarks: async (): Promise<Landmark[]> => {
    const response = await axios.get(`/api/landmarks`);
    return response.data;
  },
};
