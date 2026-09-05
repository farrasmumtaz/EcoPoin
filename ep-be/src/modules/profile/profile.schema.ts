import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).nullable().optional();

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(160).optional(),
  organizationName: z.string().trim().min(2).max(160).optional(),
  address: optionalText(500),
  contactPhone: optionalText(32),
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "At least one field must be provided.",
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
