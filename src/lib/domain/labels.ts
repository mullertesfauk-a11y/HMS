/**
 * Human-readable labels + badge variants for domain enums.
 *
 * Deliberately free of `server-only` so both server components and client
 * components (status badges, tables) can import it. "Not color alone":
 * every badge pairs a label with a distinct variant.
 */

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "amber"
  | "blue"
  | "green"
  | "red"
  | "violet"
  | "stone";

const LABELS: Record<string, { label: string; variant: BadgeVariant }> = {
  // Reservation statuses
  PENDING: { label: "Pending", variant: "amber" },
  CONFIRMED: { label: "Confirmed", variant: "blue" },
  CHECKED_IN: { label: "Checked in", variant: "green" },
  CHECKED_OUT: { label: "Checked out", variant: "stone" },
  CANCELLED: { label: "Cancelled", variant: "red" },
  NO_SHOW: { label: "No show", variant: "violet" },

  // Payment statuses
  PAID: { label: "Paid", variant: "green" },
  PENDING_PAYMENT: { label: "Payment pending", variant: "amber" },
  FAILED: { label: "Failed", variant: "red" },
  REFUNDED: { label: "Refunded", variant: "stone" },

  // Payment methods
  CASH: { label: "Cash", variant: "neutral" },
  BANK_TRANSFER: { label: "Bank transfer", variant: "neutral" },
  CARD: { label: "Card", variant: "neutral" },
  ONLINE: { label: "Online", variant: "neutral" },

  // Room statuses
  AVAILABLE: { label: "Available", variant: "green" },
  OCCUPIED: { label: "Occupied", variant: "amber" },
  MAINTENANCE: { label: "Maintenance", variant: "violet" },
  OUT_OF_SERVICE: { label: "Out of service", variant: "red" },

  // Room type statuses
  ACTIVE: { label: "Active", variant: "green" },
  INACTIVE: { label: "Inactive", variant: "stone" },

  // User roles / statuses
  ADMIN: { label: "Admin", variant: "brand" },
  STAFF: { label: "Staff", variant: "neutral" },
  DISABLED: { label: "Disabled", variant: "red" },

  // Order statuses
  PLACED: { label: "Placed", variant: "blue" },
  COMPLETED: { label: "Completed", variant: "green" },
};

/** Label + badge variant for any known enum value; safe fallback. */
export function statusMeta(value: string | null | undefined): {
  label: string;
  variant: BadgeVariant;
} {
  if (!value) return { label: "—", variant: "neutral" };
  return LABELS[value] ?? { label: value, variant: "neutral" };
}

export function statusLabel(value: string | null | undefined): string {
  return statusMeta(value).label;
}
