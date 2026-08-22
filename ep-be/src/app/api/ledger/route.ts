import { listLedgerSchema } from "@/modules/ledger/ledger.schema";
import { listLedgerEntries } from "@/modules/ledger/ledger.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listLedgerSchema, query);
    return successResponse(await listLedgerEntries(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
