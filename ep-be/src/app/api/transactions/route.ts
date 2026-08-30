import { listTransactionsSchema } from "@/modules/transactions/transaction.schema";
import { listTransactions } from "@/modules/transactions/transaction.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

// NOTE: no POST here. How staff actually build a multi-item transaction
// draft (weighing UI, photo upload, offline queue...) is still an open team
// decision - same status as the old Deposit-creation gap it replaces. This
// route only covers finalize/settle/cancel + listing, which operate on
// whatever DRAFT transactions already exist (see
// prisma/seed-phase3-test-data.sql for how to seed one to test against).
export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listTransactionsSchema, query);
    return successResponse(await listTransactions(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
