import { transactionIdSchema, updateTransactionSchema } from "@/modules/transactions/transaction.schema";
import { getTransaction, updateTransaction } from "@/modules/transactions/transaction.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext { readonly params: Promise<{ readonly id: string }> }
async function idFrom(context: RouteContext): Promise<string> { return parseSchema(transactionIdSchema, (await context.params).id); }

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireAuth();
    return successResponse({ transaction: await getTransaction(user.organizationId, await idFrom(context)) });
  } catch (error: unknown) { return errorResponse(error); }
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(updateTransactionSchema, await request.json());
    return successResponse({ transaction: await updateTransaction(user.organizationId, user.id, await idFrom(context), input) });
  } catch (error: unknown) { return errorResponse(error); }
}
