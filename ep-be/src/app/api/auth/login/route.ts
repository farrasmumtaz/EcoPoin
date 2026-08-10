import { errorResponse, successResponse } from "@/shared/http/api-response";
import { validateSchema } from "../../../../../validation/validate-schema";
import { loginSchema } from "@/modules/auth/auth.schema";
import { login } from "@/modules/auth/auth.service";

export async function POST(request: Request): Promise<Response> {
  try {
    const body: unknown = await request.json();
    const input = validateSchema(loginSchema, body);
    const user = await login(input);

    return successResponse({ user });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
