import { memberIdSchema, updateMemberSchema } from "@/modules/members/member.schema";
import { deactivateMember, getMember, updateMember } from "@/modules/members/member.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

async function parseId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  return parseSchema(memberIdSchema, id);
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const user = await requireAuth();
    return successResponse({
      member: await getMember(user.organizationId, await parseId(context)),
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
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(updateMemberSchema, await request.json());
    return successResponse({
      member: await updateMember(
        user.organizationId,
        await parseId(context),
        input,
      ),
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
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    return successResponse({
      member: await deactivateMember(
        user.organizationId,
        await parseId(context),
      ),
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
