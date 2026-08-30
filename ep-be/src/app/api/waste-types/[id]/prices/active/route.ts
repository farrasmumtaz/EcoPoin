import {
  activePriceQuerySchema,
  wasteTypeIdSchema,
} from "@/modules/waste-types/waste-type.schema";
import { getActivePrice } from "@/modules/waste-types/waste-type.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const wasteTypeId = parseSchema(wasteTypeIdSchema, id);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const { priceScheme } = parseSchema(activePriceQuerySchema, query);
    return successResponse({
      priceVersion: await getActivePrice(
        user.organizationId,
        wasteTypeId,
        priceScheme,
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
