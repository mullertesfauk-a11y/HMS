import "server-only";

import { utcToHotelDate } from "@/lib/dates";

/** Format a money amount in the hotel's currency, e.g. 12,500 ETB. */
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

/** Display a date-only value (UTC midnight) as YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  return utcToHotelDate(date);
}

/** Display a date-only value in a friendly format ("Aug 20, 2026"). */
export function formatDateFriendly(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Display a timestamp ("Aug 14, 2026, 4:05 PM"). */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
