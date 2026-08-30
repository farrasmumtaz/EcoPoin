import {
  createPriceVersionSchema,
  listPriceVersionsSchema,
  wasteTypeIdSchema,
} from "@/modules/waste-types/waste-type.schema";
import {
  createPriceVersion,
  listPriceVersions,
} from "@/modules/waste-types/waste-type.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
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
    const input = parseSchema(listPriceVersionsSchema, query);
    return successResponse(
      await listPriceVersions(user.organizationId, wasteTypeId, input),
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

// Price changes are restricted to ADMIN/COORDINATOR, same sensitivity level
// as verifying/finalizing money-moving records elsewhere in this API.
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "COORDINATOR"]);
    const { id } = await context.params;
    const wasteTypeId = parseSchema(wasteTypeIdSchema, id);
    const input = parseSchema(createPriceVersionSchema, await request.json());
    const priceVersion = await createPriceVersion(
      user.organizationId,
      wasteTypeId,
      input,
    );
    return successResponse({ priceVersion }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
