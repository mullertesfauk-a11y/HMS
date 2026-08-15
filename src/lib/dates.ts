import "server-only";

/**
 * Hotel date/time helpers.
 *
 * Reservation dates are DATE-only values ("YYYY-MM-DD"). To avoid timezone
 * bugs, every date-only value is handled as a UTC-midnight Date on the
 * boundary with the database (Prisma `@db.Date`), and formatted back as a
 * plain "YYYY-MM-DD" string for the wire. Never format these with
 * browser-local timezone semantics.
 *
 * The hotel's configured timezone only affects *display* formatting, not the
 * stored date values or overlap math.
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse "YYYY-MM-DD" into a UTC-midnight Date, or null if invalid. */
export function hotelDateToUtc(value: string): Date | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isValidCalendarDate =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

  return isValidCalendarDate ? date : null;
}

/** Format a UTC-midnight Date back to "YYYY-MM-DD". */
export function utcToHotelDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Number of nights between check-in and check-out.
 * Both inputs must be UTC-midnight Dates (see hotelDateToUtc).
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

/** checkIn must be strictly before checkOut. */
export function isValidDateRange(checkIn: Date, checkOut: Date): boolean {
  return checkIn.getTime() < checkOut.getTime();
}

/**
 * Classic interval-overlap test for reservations:
 *   existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
 *
 * Example: existing Aug 20 → Aug 23 vs requested Aug 23 → Aug 25 => no overlap
 * (allowed). Requested Aug 22 → Aug 25 => overlap (not allowed).
 */
export function rangesOverlap(
  aCheckIn: Date,
  aCheckOut: Date,
  bCheckIn: Date,
  bCheckOut: Date,
): boolean {
  return aCheckIn.getTime() < bCheckOut.getTime() && bCheckIn.getTime() < aCheckOut.getTime();
}

/** Format a date for display in the hotel's configured timezone. */
export function formatForDisplay(
  value: Date | string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = typeof value === "string" ? hotelDateToUtc(value) ?? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { timeZone: timezone, ...options }).format(date);
}
