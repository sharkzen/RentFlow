import { z } from "zod";
const PHONE_REGEX = /^0[0-9]{8,9}$/;
const LINE_ID_REGEX = /^[a-zA-Z0-9@._-]+$/;

export const updateOwnerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),

  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message:
        "Invalid phone number format (must be 9-10 digits starting with 0)",
    }),

  lineId: z
    .string()
    .trim()
    .max(50, "Line ID is too long")
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || LINE_ID_REGEX.test(val), {
      message:
        "Line ID must contain only English letters, numbers, and @ . _ -",
    })
    .refine(
      (val) => !val || !/\s/.test(val),
      "Line ID must not contain spaces",
    ),

  facebook: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((val) => {
      if (!val) return true;

      try {
        const url = new URL(val);
        return (
          url.hostname.includes("facebook.com") ||
          url.hostname.includes("fb.com") ||
          url.hostname.includes("fb.me")
        );
      } catch {
        return false;
      }
    }, "Invalid Facebook URL format"),
});

export type UpdateOwnerDto = z.infer<typeof updateOwnerSchema>;
