import { z } from "zod";

export const transactionStatusSchema = z.enum([
  "DRAFT",
  "FINALIZED",
  "COMPLETED",
  "CANCELLED",
]);

export const settlementMethodSchema = z.enum(["DIRECT_CASH", "SAVINGS"]);

export const listTransactionsSchema = z
  .object({
    status: transactionStatusSchema.optional(),
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

export const transactionIdSchema = z.string().uuid();

export const settleTransactionSchema = z.object({
  settlementMethod: settlementMethodSchema,
});

export const cancelTransactionSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
export type SettleTransactionInput = z.infer<typeof settleTransactionSchema>;
export type CancelTransactionInput = z.infer<typeof cancelTransactionSchema>;
