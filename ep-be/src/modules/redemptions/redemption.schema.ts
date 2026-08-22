import { z } from "zod";

export const redemptionStatusSchema = z.enum(["COMPLETED", "CANCELLED"]);

export const createRedemptionSchema = z.object({
  memberId: z.string().uuid(),
  points: z.coerce.number().positive().max(999_999_999_999.99),
  redemptionType: z.string().trim().min(2).max(120),
  notes: z.string().trim().min(1).max(500).nullable().optional(),
});

export const listRedemptionsSchema = z.object({
  memberId: z.string().uuid().optional(),
  status: redemptionStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const redemptionIdSchema = z.string().uuid();

export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>;
export type ListRedemptionsInput = z.infer<typeof listRedemptionsSchema>;
