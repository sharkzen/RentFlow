export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeaturePayload {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateFeaturePayload {
  name?: string;
  description?: string;
  enabled?: boolean;
}

export interface ApiResponse_Feature<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
