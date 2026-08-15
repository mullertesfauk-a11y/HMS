import "server-only";

import { NextResponse } from "next/server";

import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

/**
 * Standardized API responses.
 *
 * Success:  { success: true,  data, meta? }
 * Error:    { success: false, error: { code, message, details? } }
 *
 * Every route handler should return through these helpers so the public
 * website and a future mobile app share one contract.
 */

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function ok<T>(data: T, meta?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

/** Map an unknown thrown value to a standardized error response. */
export function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return fail(error.status, error.code, error.message, error.details);
  }
  if (error instanceof z.ZodError) {
    return fail(422, "VALIDATION_ERROR", "Invalid input", error.flatten());
  }
  // Prisma / unexpected errors: log server-side, never expose internals.
  logger.error("Unhandled error in route handler", { error: error as Error });
  return fail(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
}

/** Re-export for convenience — helps callers throw the same error everywhere. */
export { ValidationError };
