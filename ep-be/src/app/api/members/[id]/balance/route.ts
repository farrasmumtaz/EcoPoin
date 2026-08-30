import { memberIdParamSchema } from "@/modules/ledger/ledger.schema";
import { getMemberBalance } from "@/modules/ledger/ledger.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

// Kept as its own file under the existing members/[id]/ path rather than
// touching src/modules/members/* - that module is already done/merged, this
// is purely additive. Balance is intentionally NOT stored on Member; it's
// always computed live from ledger_entries (see prisma/README.md "Ledger
// convention" and root README.md "Saldo dihitung dari agregasi ledger").
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const memberId = parseSchema(memberIdParamSchema, id);
    return successResponse(await getMemberBalance(user.organizationId, memberId));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
