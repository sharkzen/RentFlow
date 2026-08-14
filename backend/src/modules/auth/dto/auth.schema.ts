import { z } from "zod";
import { extractMapUrlFromText } from "../../../lib/extractLatLng";

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
  mapUrl: z.string().transform((val) => extractMapUrlFromText(val)),
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

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string(),
  newPassword: z.string(),
});
