import { depositIdSchema } from "@/modules/deposits/deposit.schema";
import { verifyDeposit } from "@/modules/deposits/deposit.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

// Verification is restricted to ADMIN/COORDINATOR (not OPERATOR) so the
// person confirming a deposit is someone other than routine front-desk data
// entry. Adjust the allowed roles here if the team wants OPERATOR to verify
// their own entries too.
export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "COORDINATOR"]);
    const { id } = await context.params;
    const depositId = parseSchema(depositIdSchema, id);
    return successResponse({
      deposit: await verifyDeposit(user.organizationId, user.id, depositId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
