import { updateWasteTypeSchema, wasteTypeIdSchema } from "@/modules/waste-types/waste-type.schema";
import { deactivateWasteType, getWasteType, updateWasteType } from "@/modules/waste-types/waste-type.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

async function parseId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  return parseSchema(wasteTypeIdSchema, id);
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    return successResponse({
      wasteType: await getWasteType(user.organizationId, await parseId(context)),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN"]);
    const id = await parseId(context);
    const input = parseSchema(updateWasteTypeSchema, await request.json());
    return successResponse({
      wasteType: await updateWasteType(user.organizationId, id, input),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN"]);
    return successResponse({
      wasteType: await deactivateWasteType(
        user.organizationId,
        await parseId(context),
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
