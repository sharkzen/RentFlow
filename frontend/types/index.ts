export interface Tenant {
  id: string;
  name: string;
  room: string;
  dormitoryId: string;
  moveInDate: string;
  moveOutDate?: string;
  roomPrice: number;
  isActive: boolean;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

/**
 * Generic paginated API response envelope.
 * Shared across admin and dormitory features (identical shape,
 * previously duplicated as `PaginatedResponse`/`PaginationResponse`).
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
