import { logout } from "@/modules/auth/auth.service";
import { errorResponse, successResponse } from "@/shared/http/api-response";

export async function POST(): Promise<Response> {
  try {
    await logout();
    return successResponse({ loggedOut: true });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
