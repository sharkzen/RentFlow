import { z } from "zod";
import { RoomStatus, RoomType } from "./room.dto";

export const createRoomItemSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number(),
  type: z.nativeEnum(RoomType),
  basePrice: z.number(),
  description: z.string().optional(),
});

export const createBulkRoomsSchema = z.object({
  dormitoryId: z.string().min(1),
  rooms: z.array(createRoomItemSchema),
});

export const toggleQrStatusSchema = z.object({
  isActive: z.boolean(),
});

export const generateBulkPdfSchema = z.object({
  roomIds: z.array(z.string().min(1)).min(1),
});
