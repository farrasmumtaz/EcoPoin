import {
  cancelTransactionSchema,
  transactionIdSchema,
} from "@/modules/transactions/transaction.schema";
import { cancelTransaction } from "@/modules/transactions/transaction.service";
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
    const transactionId = parseSchema(transactionIdSchema, id);
    const { reason } = parseSchema(cancelTransactionSchema, await request.json());
    return successResponse({
      transaction: await cancelTransaction(
        user.organizationId,
        user.id,
        transactionId,
        { reason },
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
