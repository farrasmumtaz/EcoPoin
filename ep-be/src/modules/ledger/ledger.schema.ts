import { z } from "zod";

export const ledgerEntryTypeSchema = z.enum([
  "DEPOSIT",
  "WITHDRAWAL",
  "OPENING_BALANCE",
  "REVERSAL",
  "ADJUSTMENT",
]);

export const listLedgerSchema = z.object({
  memberId: z.string().uuid().optional(),
  entryType: ledgerEntryTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const memberIdParamSchema = z.string().uuid();

export type ListLedgerInput = z.infer<typeof listLedgerSchema>;
