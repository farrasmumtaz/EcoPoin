import { withdrawalIdSchema } from "@/modules/withdrawals/withdrawal.schema";
import { getWithdrawal } from "@/modules/withdrawals/withdrawal.service";
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
    const withdrawalId = parseSchema(withdrawalIdSchema, id);
    return successResponse({
      withdrawal: await getWithdrawal(user.organizationId, withdrawalId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
