import { transactionIdSchema } from "@/modules/transactions/transaction.schema";
import { getTransaction } from "@/modules/transactions/transaction.service";
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
    const transactionId = parseSchema(transactionIdSchema, id);
    return successResponse({
      transaction: await getTransaction(user.organizationId, transactionId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
