import { axios } from "@/lib/api-client";
import {
  Feature,
  CreateFeaturePayload,
  UpdateFeaturePayload,
  ApiResponse_Feature,
} from "./type";

export const FeatureService = {
  getAllFeatures: async (): Promise<ApiResponse_Feature<Feature[]>> => {
    try {
      const response = await axios.get(`/api/features/all`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "FAILED_TO_GET_FEATURES",
      );
    }
  },

  getFeature: async (key: string): Promise<ApiResponse_Feature<Feature>> => {
    try {
      const response = await axios.get(`/api/features/${key}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "FAILED_TO_GET_FEATURE");
    }
  },

  createFeature: async (
    data: CreateFeaturePayload,
  ): Promise<ApiResponse_Feature<Feature>> => {
    try {
      const response = await axios.post(`/api/features`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "FAILED_TO_CREATE_FEATURE",
      );
    }
  },

  updateFeature: async (
    key: string,
    data: UpdateFeaturePayload,
  ): Promise<ApiResponse_Feature<Feature>> => {
    try {
      const response = await axios.patch(`/api/features/${key}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "FAILED_TO_UPDATE_FEATURE",
      );
    }
  },

  deleteFeature: async (key: string): Promise<ApiResponse_Feature<Feature>> => {
    try {
      const response = await axios.delete(`/api/features/${key}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "FAILED_TO_DELETE_FEATURE",
      );
    }
  },
};
