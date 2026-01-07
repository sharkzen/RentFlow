export enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  DISABLED = "DISABLED",
}

export interface CreateRoomItemDto {
  roomNumber: string;
  type: RoomType;
  basePrice: number;
  description?: string;
}

export interface CreateBulkRoomsDto {
  dormitoryId: string;
  rooms: CreateRoomItemDto[];
}

export interface Rooms {
  id: string;
  floor: number;
  dormitoryId: string;
  roomNumber: string;
  basePrice: number;
  type: RoomType;
  status: RoomStatus;
  deletedAt: string | null;
  createdAt: string;
}
