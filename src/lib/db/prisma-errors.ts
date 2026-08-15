import "server-only";

/**
 * Prisma error detection helpers. Prisma's error codes are stable:
 *   P2002 — unique constraint violation
 *   P2003 — foreign key constraint violation
 *   P2025 — record not found
 */
export function isPrismaError(error: unknown): error is { code: string; meta?: unknown } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

export function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaError(error) && error.code === "P2002";
}

export function isForeignKeyError(error: unknown): boolean {
  // P2003 is the classic code; with driver adapters (Neon) FK violations
  // surface as P2039 with the original SQLSTATE in meta.driverAdapterError.
  return isPrismaError(error) && (error.code === "P2003" || error.code === "P2039");
}

export function isRecordNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === "P2025";
}
