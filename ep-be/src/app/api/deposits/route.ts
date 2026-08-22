import { listDepositsSchema } from "@/modules/deposits/deposit.schema";
import { listDeposits } from "@/modules/deposits/deposit.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

// NOTE: no POST here. Draft-deposit creation (roadmap task 23) was
// cancelled/replaced by the team with a different approach that hadn't been
// decided yet as of this writing - see claude/ecopoin-phase2-backend-status.md
// in the project. This route only covers Phase 3 (verify/reject + listing),
// which operates on whatever deposits already exist regardless of how they
// were created.
export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listDepositsSchema, query);
    return successResponse(await listDeposits(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
