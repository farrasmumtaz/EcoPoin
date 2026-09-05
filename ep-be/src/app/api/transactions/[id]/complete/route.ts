import { completeTransactionSchema, transactionIdSchema } from "@/modules/transactions/transaction.schema";
import { completeTransaction } from "@/modules/transactions/transaction.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext { readonly params: Promise<{ readonly id: string }> }
export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const id = parseSchema(transactionIdSchema, (await context.params).id);
    const input = parseSchema(completeTransactionSchema, await request.json());
    return successResponse({ transaction: await completeTransaction(user.organizationId, user.id, id, input) });
  } catch (error: unknown) { return errorResponse(error); }
}
