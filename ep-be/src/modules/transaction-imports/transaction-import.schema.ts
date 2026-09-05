import { z } from "zod";

const importRowSchema = z.object({
  rowNumber: z.number().int().min(2),
  memberNumber: z.string().trim().min(1).max(32),
  wasteTypeName: z.string().trim().min(1).max(120),
  condition: z.enum(["SORTED", "UNSORTED"]),
  weightKg: z.number().positive().max(999_999.999),
  payoutMethod: z.enum(["DIRECT_CASH", "SAVINGS"]),
  notes: z.string().trim().max(500).optional(),
});

export const transactionImportSchema = z.object({
  batchId: z.uuid(),
  dryRun: z.boolean().default(true),
  rows: z.array(importRowSchema).min(1).max(500),
});

export type TransactionImportInput = z.infer<typeof transactionImportSchema>;
export type TransactionImportRowInput = TransactionImportInput["rows"][number];
