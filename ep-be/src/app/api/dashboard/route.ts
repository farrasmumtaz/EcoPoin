import { getDashboard } from "@/modules/dashboard/dashboard.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";

export async function GET(): Promise<Response> {
  try { const user = await requireAuth(); return successResponse(await getDashboard(user.organizationId)); }
  catch (error: unknown) { return errorResponse(error); }
}
