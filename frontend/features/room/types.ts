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
