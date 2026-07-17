import { z } from "zod";

export const getTenantDormQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const getMyBillsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  status: z.string().optional(),
});

export const createTenantSchema = z.object({
  email: z.string().email(),
  roomId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  numberOfResidents: z.coerce.number().optional(),
  moveInDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  securityDeposit: z.coerce.number().optional(),
  advancePayment: z.coerce.number().optional(),
  entranceFee: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const updateTenantSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  securityDeposit: z.coerce.number().optional(),
  advancePayment: z.coerce.number().optional(),
  entranceFee: z.coerce.number().optional(),
  numberOfResidents: z.coerce.number().optional(),
  notes: z.string().optional(),
  moveInDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
});

export const moveOutSchema = z.object({
  moveOutDate: z.string().optional(),
});

export const generateQrPaymentSchema = z.object({
  billId: z.string().min(1),
});

export const getMaintenanceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const reEntryTenantSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  securityDeposit: z.coerce.number().optional(),
  advancePayment: z.coerce.number().optional(),
  entranceFee: z.coerce.number().optional(),
  contractStartDate: z.string(),
  contractEndDate: z.string(),
  moveInDate: z.string(),
  numberOfResidents: z.coerce.number().optional(),
  notes: z.string().optional(),
});
