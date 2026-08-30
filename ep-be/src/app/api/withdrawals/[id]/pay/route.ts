import { withdrawalIdSchema } from "@/modules/withdrawals/withdrawal.schema";
import { payWithdrawal } from "@/modules/withdrawals/withdrawal.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "COORDINATOR"]);
    const { id } = await context.params;
    const withdrawalId = parseSchema(withdrawalIdSchema, id);
    return successResponse({
      withdrawal: await payWithdrawal(user.organizationId, user.id, withdrawalId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
