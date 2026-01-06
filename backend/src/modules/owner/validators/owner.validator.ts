import { z } from "zod";
const PHONE_REGEX = /^0[0-9]{8,9}$/;
const LINE_ID_REGEX = /^[a-zA-Z0-9@._-]+$/;

export const updateOwnerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),

  phone: z
    .string()
    .trim()
    .regex(
      PHONE_REGEX,
      "Invalid phone number format (must be 9-10 digits starting with 0)",
    )
    .optional(),

  lineId: z
    .string()
    .trim()
    .max(50, "Line ID is too long")
    .regex(
      LINE_ID_REGEX,
      "Line ID must contain only English letters, numbers, and @ . _ -",
    )
    .refine((val) => !/\s/.test(val), "Line ID must not contain spaces")
    .optional(),

  facebook: z
    .string()
    .trim()
    .url("Invalid URL format")
    .refine(
      (url) => url.includes("facebook.com") || url.includes("fb.me"),
      "URL must be from Facebook",
    )
    .optional()
    .or(z.literal("")),
});

export type UpdateOwnerDto = z.infer<typeof updateOwnerSchema>;
