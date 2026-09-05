import { z } from "zod";

export const listLedgerSchema = z.object({
  search: z.string().trim().max(160).optional(),
  memberId: z.uuid().optional(),
  entryType: z.enum(["DEPOSIT", "WITHDRAWAL", "REVERSAL", "ADJUSTMENT"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListLedgerInput = z.infer<typeof listLedgerSchema>;
