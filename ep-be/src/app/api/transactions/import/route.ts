import { transactionImportSchema } from "@/modules/transaction-imports/transaction-import.schema";
import { importTransactions } from "@/modules/transaction-imports/transaction-import.service";
import { requireRole } from "@/shared/auth/require-role";
import { errorResponse, successResponse } from "@/shared/http/api-response";
import { parseSchema } from "@/shared/validation/parse-schema";

export async function POST(request: Request): Promise<Response> {
  try {
    const user = await requireRole(["ADMIN", "OPERATOR", "COORDINATOR"]);
    const input = parseSchema(transactionImportSchema, await request.json());
    return successResponse(await importTransactions(user.organizationId, user.id, input), {
      status: input.dryRun ? 200 : 201,
    });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
