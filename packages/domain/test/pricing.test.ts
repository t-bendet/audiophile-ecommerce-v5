import { describe, expect, it } from "vitest";
import { SHIPPING_COST, TAX_RATE, calculateOrderTotals } from "../src/index.js";

describe("calculateOrderTotals", () => {
  it("returns only shipping for an empty subtotal", () => {
    expect(calculateOrderTotals(0)).toEqual({
      subtotal: 0,
      shippingCost: 50,
      tax: 0,
      total: 50,
    });
  });

  it("rounds a fractional tax the way Math.round does", () => {
    expect(calculateOrderTotals(1).tax).toBe(0);
    expect(calculateOrderTotals(3).tax).toBe(1);
    expect(calculateOrderTotals(1999).tax).toBe(400);
  });

  it("keeps total equal to subtotal plus shipping plus tax", () => {
    for (const subtotal of [0, 3, 1999, 123456]) {
      const totals = calculateOrderTotals(subtotal);

      expect(totals.total).toBe(
        totals.subtotal + totals.shippingCost + totals.tax,
      );
    }
  });

  it("exposes the shared constants", () => {
    expect(SHIPPING_COST).toBe(50);
    expect(TAX_RATE).toBe(0.2);
  });
});
