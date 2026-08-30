import { transactionIdSchema } from "@/modules/transactions/transaction.schema";
import { finalizeTransaction } from "@/modules/transactions/transaction.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

// Any staff role can finalize - it only locks the item list and snapshots
// the rupiah total, it does not move money yet (that happens at /settle).
export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const { id } = await context.params;
    const transactionId = parseSchema(transactionIdSchema, id);
    return successResponse({
      transaction: await finalizeTransaction(user.organizationId, transactionId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
