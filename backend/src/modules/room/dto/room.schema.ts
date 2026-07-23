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

export const updateRoomSchema = z.object({
  roomNumber: z.string().optional(),
  floor: z.number().optional(),
  type: z.nativeEnum(RoomType).optional(),
  basePrice: z.number().optional(),
  description: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
});

export const getRoomsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  floor: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
