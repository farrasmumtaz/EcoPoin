import { z } from "zod";

export const memberTypeSchema = z.enum(["INDIVIDUAL", "UNIT"]);

const nullableText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).nullable().optional();

export const createMemberSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160),
    type: memberTypeSchema,
    rt: nullableText(16),
    phone: nullableText(32),
    picName: nullableText(160),
    picPhone: nullableText(32),
    unitIds: z.array(z.string().uuid()).max(20).default([]),
  })
  .superRefine((value, context) => {
    if (value.type === "UNIT" && !value.picName) {
      context.addIssue({
        code: "custom",
        path: ["picName"],
        message: "PIC name is required for a unit.",
      });
    }

    if (value.type === "UNIT" && value.unitIds.length > 0) {
      context.addIssue({
        code: "custom",
        path: ["unitIds"],
        message: "Only individual members can be linked to units.",
      });
    }

    if (value.type === "INDIVIDUAL" && (value.picName || value.picPhone)) {
      context.addIssue({
        code: "custom",
        path: ["picName"],
        message: "PIC fields are only valid for a unit.",
      });
    }
  });

export const updateMemberSchema = z
  .object({
    fullName: z.string().trim().min(2).max(160).optional(),
    rt: nullableText(16),
    phone: nullableText(32),
    picName: nullableText(160),
    picPhone: nullableText(32),
    isActive: z.boolean().optional(),
    unitIds: z.array(z.string().uuid()).max(20).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });

export const listMembersSchema = z.object({
  search: z.string().trim().max(160).optional(),
  type: memberTypeSchema.optional(),
  unitId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const memberIdSchema = z.string().uuid();

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type ListMembersInput = z.infer<typeof listMembersSchema>;
