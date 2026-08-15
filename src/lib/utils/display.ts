/**
 * Client-safe display formatters.
 *
 * These run in the browser (admin tables, badges) so they must not import
 * anything with `server-only`. Server components that need the same
 * formatting can import from here too — everything is pure.
 */

/** Format a money amount in a currency, e.g. "ETB 29,325". */
export function formatMoney(amount: number | { toNumber(): number }, currency: string): string {
  const value = typeof amount === "number" ? amount : amount.toNumber();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown currency code — fall back to plain number + code.
    return `${value.toLocaleString("en-US")} ${currency}`;
  }
}

/**
 * Format a date-only value ("YYYY-MM-DD" or a Date/ISO string) in a friendly
 * style. Reservation dates are stored as UTC-midnight, so always render with
 * UTC semantics to avoid timezone drift.
 */
export function formatDateFriendly(value: string | Date): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Compact "Aug 20" style for table columns. */
export function formatDateShort(value: string | Date): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Timestamp display ("Aug 14, 2026, 4:05 PM") in UTC. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
