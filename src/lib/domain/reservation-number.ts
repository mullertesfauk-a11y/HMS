import "server-only";

import { randomBytes } from "node:crypto";

/**
 * Human-friendly reservation numbers, e.g. `HTL-2026-8F4X21`.
 *
 * - Unique (random 6-char suffix, collision-resistant enough for booking volumes).
 * - Easy to read and type (no ambiguous characters: 0/O, 1/I/L).
 * - Safe to expose publicly (no internal DB IDs, no PII).
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomSuffix(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return result;
}

export function generateReservationNumber(prefix = "HTL", year = new Date().getUTCFullYear()): string {
  return `${prefix}-${year}-${randomSuffix(6)}`;
}
