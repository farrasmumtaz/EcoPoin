import { redemptionIdSchema } from "@/modules/redemptions/redemption.schema";
import { getRedemption } from "@/modules/redemptions/redemption.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const redemptionId = parseSchema(redemptionIdSchema, id);
    return successResponse({
      redemption: await getRedemption(user.organizationId, redemptionId),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
