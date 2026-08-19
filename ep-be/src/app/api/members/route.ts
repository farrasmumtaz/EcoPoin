import { createMemberSchema, listMembersSchema } from "@/modules/members/member.schema";
import { createMember, listMembers } from "@/modules/members/member.service";
import { requireAuth } from "@/shared/auth/require-auth";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireAuth();
    const query = Object.fromEntries(new URL(request.url).searchParams);
    const input = parseSchema(listMembersSchema, query);
    return successResponse(await listMembers(user.organizationId, input));
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(createMemberSchema, await request.json());
    const member = await createMember(user.organizationId, input);
    return successResponse({ member }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
