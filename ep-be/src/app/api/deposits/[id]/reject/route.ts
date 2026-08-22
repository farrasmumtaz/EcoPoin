import { depositIdSchema, rejectDepositSchema } from "@/modules/deposits/deposit.schema";
import { rejectDeposit } from "@/modules/deposits/deposit.service";
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
    const depositId = parseSchema(depositIdSchema, id);
    const { reason } = parseSchema(rejectDepositSchema, await request.json());
    return successResponse({
      deposit: await rejectDeposit(user.organizationId, user.id, depositId, reason),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
