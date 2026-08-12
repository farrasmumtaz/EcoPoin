import type { z } from "zod";

import { ValidationError } from "@/shared/errors/app-error";

export function parseSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError({
      fields: result.error.flatten().fieldErrors,
      form: result.error.flatten().formErrors,
    });
  }

  return result.data;
}
