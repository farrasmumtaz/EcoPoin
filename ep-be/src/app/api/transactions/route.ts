import { createTransactionSchema, listTransactionsSchema } from "@/modules/transactions/transaction.schema";
import { createTransaction, listTransactions } from "@/modules/transactions/transaction.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const input = parseSchema(listTransactionsSchema, Object.fromEntries(new URL(request.url).searchParams));
    return successResponse(await listTransactions(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(createTransactionSchema, await request.json());
    return successResponse({ transaction: await createTransaction(user.organizationId, user.id, input) }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
