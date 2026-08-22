import {
  createRedemptionSchema,
  listRedemptionsSchema,
} from "@/modules/redemptions/redemption.schema";
import {
  createRedemption,
  listRedemptions,
} from "@/modules/redemptions/redemption.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listRedemptionsSchema, query);
    return successResponse(await listRedemptions(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(createRedemptionSchema, await request.json());
    const redemption = await createRedemption(user.organizationId, user.id, input);
    return successResponse({ redemption }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
