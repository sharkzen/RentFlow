import { z } from "zod";

export const getAllDormsQuerySchema = z.object({
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  landmarkId: z.string().optional(),
  page: z.coerce.number().optional(),
});

export const createDormSchema = z.object({
  name: z.string(),
});

export const updateDormSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.any(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  mapUrl: z.string(),
  roomPrice: z.number().optional(),
  waterRate: z.number(),
  electricRate: z.number(),
  commonFee: z.number().optional(),
  lateFee: z.number().optional(),
  dueDay: z.number(),
  dueMonthOffset: z.number().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankHolder: z.string().optional(),
  promptPayType: z.string().optional(),
  promptPayValue: z.string().optional(),
});

export const updateDormStatusSchema = z.object({
  isPublished: z.boolean(),
});

export const reorderDormImagesSchema = z.object({
  images: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      isCover: z.boolean(),
    }),
  ),
});

export const dashboardQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});
