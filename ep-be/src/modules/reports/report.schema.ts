import { z } from "zod";

export const reportQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  rt: z.string().trim().max(16).optional(),
  wasteTypeId: z.uuid().optional(),
  payoutMethod: z.enum(["DIRECT_CASH", "SAVINGS"]).optional(),
}).refine(({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo, {
  message: "dateFrom must be before or equal to dateTo.",
  path: ["dateTo"],
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;
