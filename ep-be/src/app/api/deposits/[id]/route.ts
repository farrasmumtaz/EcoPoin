import { depositIdSchema } from "@/modules/deposits/deposit.schema";
import { getDeposit } from "@/modules/deposits/deposit.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const depositId = parseSchema(depositIdSchema, id);
    return successResponse({
      deposit: await getDeposit(user.organizationId, depositId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
