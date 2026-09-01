import { createWasteTypeSchema, listWasteTypesSchema } from "@/modules/waste-types/waste-type.schema";
import { createWasteType, listWasteTypes } from "@/modules/waste-types/waste-type.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listWasteTypesSchema, params);
    return successResponse(await listWasteTypes(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN"]);
    const input = parseSchema(createWasteTypeSchema, await request.json());
    const wasteType = await createWasteType(user.organizationId, user.id, input);
    return successResponse({ wasteType }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
