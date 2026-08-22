import { z } from "zod";

export const ledgerSourceTypeSchema = z.enum(["DEPOSIT", "REDEMPTION"]);
export const ledgerEntryTypeSchema = z.enum(["CREDIT", "DEBIT", "REVERSAL"]);

export const listLedgerSchema = z.object({
  memberId: z.string().uuid().optional(),
  sourceType: ledgerSourceTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const memberIdParamSchema = z.string().uuid();

export type ListLedgerInput = z.infer<typeof listLedgerSchema>;
