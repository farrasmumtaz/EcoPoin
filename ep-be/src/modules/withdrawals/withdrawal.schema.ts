import { z } from "zod";

export const withdrawalStatusSchema = z.enum([
  "REQUESTED",
  "APPROVED",
  "PAID",
  "REJECTED",
]);

export const createWithdrawalSchema = z.object({
  memberId: z.string().uuid(),
  amountRupiah: z.coerce.number().positive().max(999_999_999_999.99),
  notes: z.string().trim().min(1).max(500).nullable().optional(),
});

export const listWithdrawalsSchema = z.object({
  memberId: z.string().uuid().optional(),
  status: withdrawalStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const withdrawalIdSchema = z.string().uuid();

export const rejectWithdrawalSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ListWithdrawalsInput = z.infer<typeof listWithdrawalsSchema>;
export type RejectWithdrawalInput = z.infer<typeof rejectWithdrawalSchema>;
