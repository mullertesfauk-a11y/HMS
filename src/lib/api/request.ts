import "server-only";

import type { NextRequest } from "next/server";

import { ValidationError } from "@/lib/errors";

/** Best-effort client IP (used for rate limiting keys). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Parse a JSON request body, throwing ValidationError on malformed input. */
export async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
}
