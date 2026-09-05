import { z } from "zod"; import { getPublicReceipt } from "@/modules/receipts/receipt.service"; import { errorResponse, successResponse } from "@/shared/http/api-response"; import { parseSchema } from "@/shared/validation/parse-schema";
interface Context { readonly params: Promise<{ readonly token: string }>; }
export async function GET(_request: Request, context: Context): Promise<Response> { try { const token = parseSchema(z.uuid(), (await context.params).token); return successResponse({ receipt: await getPublicReceipt(token) }); } catch (error: unknown) { return errorResponse(error); } }
