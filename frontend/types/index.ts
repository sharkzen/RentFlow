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
