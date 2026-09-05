import { getTransactionReport } from "@/modules/reports/report.service";
import { reportQuerySchema } from "@/modules/reports/report.schema";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = parseSchema(reportQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
    return successResponse(await getTransactionReport(user.organizationId, query));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
