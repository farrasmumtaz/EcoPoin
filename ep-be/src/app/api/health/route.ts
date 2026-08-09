import { successResponse } from "@/shared/http/api-response";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return successResponse({
    service: "ep-be",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
