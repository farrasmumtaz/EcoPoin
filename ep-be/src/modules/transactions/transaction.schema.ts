import { z } from "zod";

const transactionItemSchema = z.object({
  wasteTypeId: z.uuid(),
  condition: z.enum(["SORTED", "UNSORTED"]),
  weightKg: z.coerce.number().positive().max(999_999.999),
});

export const createTransactionSchema = z.object({
  memberId: z.uuid(),
  clientRequestId: z.uuid(),
  source: z.enum(["DIRECT_ENTRY", "IMPORT"]).default("DIRECT_ENTRY"),
  notes: z.string().trim().max(500).optional(),
  items: z.array(transactionItemSchema).min(1).max(20),
});

export const updateTransactionSchema = z
  .object({
    memberId: z.uuid().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    items: z.array(transactionItemSchema).min(1).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const completeTransactionSchema = z.object({
  payoutMethod: z.enum(["DIRECT_CASH", "SAVINGS"]),
});

export const cancelTransactionSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const transactionIdSchema = z.uuid();

export const listTransactionsSchema = z.object({
  memberId: z.uuid().optional(),
  status: z
    .enum(["DRAFT", "FINALIZED", "COMPLETED", "CANCELLED", "VOIDED"])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CompleteTransactionInput = z.infer<typeof completeTransactionSchema>;
export type CancelTransactionInput = z.infer<typeof cancelTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
