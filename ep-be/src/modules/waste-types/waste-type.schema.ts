import { z } from "zod";

const nameSchema = z.string().trim().min(2).max(120);
const pricePerKgSchema = z.coerce.number().positive().max(999_999_999_999.99);

export const wasteCategorySchema = z.enum(["PLASTIC", "PAPER", "METAL", "GLASS", "OTHER"]);

export const createWasteTypeSchema = z.object({
  name: nameSchema,
  category: wasteCategorySchema,
  sortedPricePerKg: pricePerKgSchema,
  unsortedPricePerKg: pricePerKgSchema,
  unit: z.string().trim().min(1).max(16).default("kg"),
});

export const updateWasteTypeSchema = createWasteTypeSchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const wasteTypeIdSchema = z.string().uuid();

export const listWasteTypesSchema = z.object({
  category: wasteCategorySchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateWasteTypeInput = z.infer<typeof createWasteTypeSchema>;
export type UpdateWasteTypeInput = z.infer<typeof updateWasteTypeSchema>;
export type ListWasteTypesInput = z.infer<typeof listWasteTypesSchema>;
