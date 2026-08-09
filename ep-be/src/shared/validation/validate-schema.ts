import type { z } from "zod";

import { ValidationError } from "@/shared/errors/app-error";

export function validateSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ValidationError({ fields: result.error.flatten().fieldErrors });
  }

  return result.data;
}
