import { z } from "zod";

export const depositStatusSchema = z.enum(["DRAFT", "VERIFIED", "REJECTED"]);

export const listDepositsSchema = z
  .object({
    status: depositStatusSchema.optional(),
    memberId: z.string().uuid().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { message: "dateFrom must be before or equal to dateTo.", path: ["dateFrom"] },
  );

export const depositIdSchema = z.string().uuid();

export const rejectDepositSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type ListDepositsInput = z.infer<typeof listDepositsSchema>;
export type RejectDepositInput = z.infer<typeof rejectDepositSchema>;
