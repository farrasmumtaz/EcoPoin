import { listLedgerSchema } from "@/modules/ledger/ledger.schema";
import { listLedger } from "@/modules/ledger/ledger.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const input = parseSchema(listLedgerSchema, Object.fromEntries(new URL(request.url).searchParams));
    return successResponse(await listLedger(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
