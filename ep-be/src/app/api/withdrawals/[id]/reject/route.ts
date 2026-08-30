import {
  rejectWithdrawalSchema,
  withdrawalIdSchema,
} from "@/modules/withdrawals/withdrawal.schema";
import { rejectWithdrawal } from "@/modules/withdrawals/withdrawal.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "COORDINATOR"]);
    const { id } = await context.params;
    const withdrawalId = parseSchema(withdrawalIdSchema, id);
    const { reason } = parseSchema(rejectWithdrawalSchema, await request.json());
    return successResponse({
      withdrawal: await rejectWithdrawal(
        user.organizationId,
        user.id,
        withdrawalId,
        { reason },
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
