import { memberIdSchema } from "@/modules/members/member.schema";
import { getMemberSummary } from "@/modules/members/member-summary.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext { readonly params: Promise<{ readonly id: string }>; }
export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try { const user = await requireAuth(); const id = parseSchema(memberIdSchema, (await context.params).id); return successResponse(await getMemberSummary(user.organizationId, id)); }
  catch (error: unknown) { return errorResponse(error); }
}
