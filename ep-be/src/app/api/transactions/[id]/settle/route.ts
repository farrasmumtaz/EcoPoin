import {
  settleTransactionSchema,
  transactionIdSchema,
} from "@/modules/transactions/transaction.schema";
import { settleTransaction } from "@/modules/transactions/transaction.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

// Settling can move money into the savings ledger (SAVINGS), so it's
// restricted to ADMIN/COORDINATOR - not routine front-desk data entry, same
// bar as the old deposit-verify gate it replaces.
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "COORDINATOR"]);
    const { id } = await context.params;
    const transactionId = parseSchema(transactionIdSchema, id);
    const input = parseSchema(settleTransactionSchema, await request.json());
    return successResponse({
      transaction: await settleTransaction(
        user.organizationId,
        user.id,
        transactionId,
        input,
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
