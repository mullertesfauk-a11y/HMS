import "server-only";

/**
 * Authoritative pricing calculation.
 *
 * The server — never the browser — computes reservation totals:
 *   subtotal = pricePerNight × numberOfNights
 *   total    = subtotal + tax − discount
 *
 * Money is computed in integer minor units (cents) to avoid floating-point
 * drift, then returned as decimal numbers for storage in Prisma Decimal
 * columns. The tax rate and discount are inputs so seasonal pricing, rate
 * plans, and promotions can be layered in later without changing this core.
 */

export interface PricingInput {
  pricePerNight: number;
  numberOfNights: number;
  /** Percentage, e.g. 15 = 15%. */
  taxRate?: number;
  /** Flat discount in the same currency as pricePerNight. */
  discount?: number;
}

export interface PricingBreakdown {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

function toMinorUnits(value: number): number {
  return Math.round(value * 100);
}

function toMajorUnits(minor: number): number {
  return Math.round(minor) / 100;
}

export function calculatePricing(input: PricingInput): PricingBreakdown {
  const taxRate = input.taxRate ?? 0;
  const discount = input.discount ?? 0;

  const subtotalMinor = toMinorUnits(input.pricePerNight) * input.numberOfNights;
  const taxMinor = Math.round(subtotalMinor * (taxRate / 100));
  const discountMinor = toMinorUnits(discount);
  const totalMinor = subtotalMinor + taxMinor - discountMinor;

  return {
    subtotal: toMajorUnits(subtotalMinor),
    tax: toMajorUnits(taxMinor),
    discount: toMajorUnits(discountMinor),
    total: toMajorUnits(Math.max(totalMinor, 0)),
  };
}
