import { z } from "zod";
export const createWithdrawalSchema = z.object({ memberId: z.uuid(), amount: z.coerce.number().positive().max(999_999_999_999), notes: z.string().trim().max(500).optional() });
export const rejectWithdrawalSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const listWithdrawalsSchema = z.object({ search: z.string().trim().max(160).optional(), status: z.enum(["REQUESTED", "APPROVED", "PAID", "REJECTED"]).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) });
export const withdrawalIdSchema = z.uuid();
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type ListWithdrawalsInput = z.infer<typeof listWithdrawalsSchema>;
