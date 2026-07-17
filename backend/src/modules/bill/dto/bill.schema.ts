import { z } from "zod";
import { BillStatus } from "@prisma/client";

export const getBillsQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(BillStatus).optional(),
  month: z.string().optional(),
});

export const createBillItemSchema = z.object({
  roomId: z.string(),
  prevWater: z.coerce.number().optional(),
  currentWater: z.coerce.number().optional(),
  prevElectric: z.coerce.number().optional(),
  currentElectric: z.coerce.number().optional(),
  commonFee: z.coerce.number().optional(),
  waterImageKey: z.string().optional(),
  electricImageKey: z.string().optional(),
});

export const createBillsSchema = z.object({
  dormId: z.string(),
  billingMonth: z.string(),
  items: z.array(createBillItemSchema),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(BillStatus),
});

export const addBillItemSchema = z.object({
  name: z.string().min(1),
  amount: z.coerce.number(),
  type: z.enum(["CHARGE", "DISCOUNT"]),
});

export const updateBillItemSchema = z.object({
  name: z.string().optional(),
  amount: z.coerce.number().optional(),
  type: z.enum(["CHARGE", "DISCOUNT"]).optional(),
});

export const rejectBillSchema = z.object({
  reason: z.string().optional(),
});

export const sendBillEmailsSchema = z.object({
  billIds: z.array(z.string()).min(1),
});

export const generatePdfSchema = z.object({
  billIds: z.array(z.string()).min(1),
});

export const saveDraftSchema = z.object({
  dormId: z.string(),
  name: z.string().min(1),
  selectedDate: z.string(),
  items: z.array(z.any()),
});

export const scanMeterSchema = z.object({
  imageBase64: z.string().min(1),
  scanType: z.enum(["WATER", "ELECTRIC"]),
  roomId: z.string(),
});
