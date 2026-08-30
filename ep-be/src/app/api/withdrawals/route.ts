import {
  createWithdrawalSchema,
  listWithdrawalsSchema,
} from "@/modules/withdrawals/withdrawal.schema";
import {
  createWithdrawal,
  listWithdrawals,
} from "@/modules/withdrawals/withdrawal.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listWithdrawalsSchema, query);
    return successResponse(await listWithdrawals(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

// Creates a REQUESTED withdrawal only - no ledger effect yet. The debit only
// happens at /pay, see root README "Model Ledger".
export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(createWithdrawalSchema, await request.json());
    const withdrawal = await createWithdrawal(user.organizationId, user.id, input);
    return successResponse({ withdrawal }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
