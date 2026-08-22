import { passbookTokenSchema } from "@/modules/passbook/passbook.schema";
import { getPassbook } from "@/modules/passbook/passbook.service";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly token: string }>;
}

// PUBLIC ROUTE - intentionally no requireAuth()/requireRole() call. The
// random publicToken (UUID) on Member IS the access credential; see
// prisma/README.md "Public receipts" and roadmap task 31/34.
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const { token } = await context.params;
    const passbookToken = parseSchema(passbookTokenSchema, token);
    return successResponse(await getPassbook(passbookToken));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
