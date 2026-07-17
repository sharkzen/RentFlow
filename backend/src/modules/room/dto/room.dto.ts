export enum RoomType {
  AIR = "AIR",
  FAN = "FAN",
}

export { RoomStatus } from "@prisma/client";

export interface CreateRoomItemDto {
  roomNumber: string;
  floor: number;
  type: RoomType;
  basePrice: number;
  description?: string;
}

export interface CreateBulkRoomsDto {
  dormitoryId: string;
  rooms: CreateRoomItemDto[];
}
