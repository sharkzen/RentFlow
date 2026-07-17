import { z } from "zod";

export const adminRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ownerRegisterSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string(),
  phone: z.string(),
  dormName: z.string(),
  address: z.string(),
  mapUrl: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const loginWithQrSchema = z.object({
  roomId: z.string(),
  token: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyResetTokenSchema = z.object({
  token: z.string(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string(),
});
