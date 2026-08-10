import { NextResponse, type NextRequest } from "next/server";

import { getServerEnv } from "@/config/env";

const ALLOWED_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function applyCorsHeaders(response: NextResponse, origin: string): void {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  response.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  response.headers.append("Vary", "Origin");
}

export function proxy(request: NextRequest): NextResponse {
  const { FRONTEND_URL } = getServerEnv();
  const origin = request.headers.get("origin");
  const isAllowedOrigin = origin === FRONTEND_URL;

  if (request.method === "OPTIONS") {
    if (!origin || !isAllowedOrigin) {
      return new NextResponse(null, { status: 403 });
    }

    const response = new NextResponse(null, { status: 204 });
    applyCorsHeaders(response, origin);
    return response;
  }

  const response = NextResponse.next();
  if (origin && isAllowedOrigin) {
    applyCorsHeaders(response, origin);
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
