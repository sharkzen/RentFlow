import { z } from "zod";
import {
  phoneSchema,
  lineIdSchema,
  facebookSchema,
} from "@/lib/validators/contact.validator";

export const updateOwnerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  phone: phoneSchema,
  lineId: lineIdSchema,
  facebook: facebookSchema,
});

export type UpdateOwnerDto = z.infer<typeof updateOwnerSchema>;
