import { NextResponse } from "next/server";

import { AppError } from "@/shared/errors/app-error";

interface ApiSuccess<TData> {
  readonly success: true;
  readonly data: TData;
  readonly meta?: Readonly<Record<string, unknown>>;
}

interface ApiFailure {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Readonly<Record<string, unknown>>;
  };
}

export function successResponse<TData>(
  data: TData,
  init?: ResponseInit,
): NextResponse<ApiSuccess<TData>> {
  return NextResponse.json({ success: true, data }, init);
}

export function errorResponse(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}
