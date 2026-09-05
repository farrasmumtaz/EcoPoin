import { getProfile, updateProfile } from "@/modules/profile/profile.service";
import { updateProfileSchema } from "@/modules/profile/profile.schema";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(): Promise<Response> {
  try { const user = await requireAuth(); return successResponse({ profile: await getProfile(user) }); }
  catch (error: unknown) { return errorResponse(error); }
}

export async function PATCH(request: Request): Promise<Response> {
  try { const user = await requireAuth(); return successResponse({ profile: await updateProfile(user, parseSchema(updateProfileSchema, await request.json())) }); }
  catch (error: unknown) { return errorResponse(error); }
}
