import { describe, expect, it } from "vitest";

import { calculateOrderPricing, calculatePricing } from "@/lib/domain/pricing";

describe("calculatePricing", () => {
  it("single night, no tax or discount", () => {
    const pricing = calculatePricing({ pricePerNight: 100, numberOfNights: 1 });
    expect(pricing.subtotal).toBe(100);
    expect(pricing.tax).toBe(0);
    expect(pricing.discount).toBe(0);
    expect(pricing.total).toBe(100);
  });

  it("multiple nights multiply the subtotal", () => {
    const pricing = calculatePricing({ pricePerNight: 125.5, numberOfNights: 3 });
    expect(pricing.subtotal).toBe(376.5);
    expect(pricing.total).toBe(376.5);
  });

  it("tax is a percentage of the subtotal", () => {
    const pricing = calculatePricing({ pricePerNight: 100, numberOfNights: 2, taxRate: 15 });
    expect(pricing.subtotal).toBe(200);
    expect(pricing.tax).toBe(30);
    expect(pricing.total).toBe(230);
  });

  it("flat discount reduces the total", () => {
    const pricing = calculatePricing({ pricePerNight: 100, numberOfNights: 2, discount: 50 });
    expect(pricing.subtotal).toBe(200);
    expect(pricing.total).toBe(150);
  });

  it("discount larger than the stay clamps total to zero", () => {
    const pricing = calculatePricing({ pricePerNight: 100, numberOfNights: 1, discount: 500 });
    expect(pricing.total).toBe(0);
  });

  it("avoids floating-point drift", () => {
    const pricing = calculatePricing({ pricePerNight: 99.99, numberOfNights: 3, taxRate: 8.5 });
    expect(pricing.subtotal).toBe(299.97);
    expect(pricing.tax).toBe(25.5); // 299.97 * 0.085 = 25.49745 → 25.5
    expect(pricing.total).toBeCloseTo(325.47, 2);
  });
});

describe("calculateOrderPricing", () => {
  it("sums unit price × quantity with no tax", () => {
    const pricing = calculateOrderPricing([
      { unitPrice: 780, quantity: 2 },
      { unitPrice: 220, quantity: 1 },
    ]);
    expect(pricing.subtotal).toBe(1780);
    expect(pricing.tax).toBe(0);
    expect(pricing.discount).toBe(0);
    expect(pricing.total).toBe(1780);
  });

  it("applies the tax rate to the subtotal", () => {
    const pricing = calculateOrderPricing([{ unitPrice: 1000, quantity: 1 }], 15);
    expect(pricing.subtotal).toBe(1000);
    expect(pricing.tax).toBe(150);
    expect(pricing.total).toBe(1150);
  });

  it("avoids floating-point drift on per-line subtotals", () => {
    const pricing = calculateOrderPricing([{ unitPrice: 99.99, quantity: 3 }], 8.5);
    expect(pricing.subtotal).toBe(299.97);
    expect(pricing.tax).toBe(25.5);
    expect(pricing.total).toBeCloseTo(325.47, 2);
  });

  it("returns zero for an empty basket", () => {
    const pricing = calculateOrderPricing([], 15);
    expect(pricing.subtotal).toBe(0);
    expect(pricing.tax).toBe(0);
    expect(pricing.total).toBe(0);
  });
});
