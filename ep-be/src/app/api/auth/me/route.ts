import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";

export async function GET(): Promise<Response> {
  try {
    const user = await requireAuth();
    return successResponse({ user });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
