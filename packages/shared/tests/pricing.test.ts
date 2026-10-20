import { describe, expect, it } from "vitest";
import {
  applyGiftCard,
  computeDiscount,
  computeGst,
  computeTotals,
  deliveryFee,
  lineTotal,
  packagingFee,
  redeemLoyalty,
  unitPrice,
} from "../src/index.js";

describe("lineTotal", () => {
  it("multiplies base price plus options by quantity", () => {
    // Rs 200 base, +Rs 30 extra cheese, +Rs 20 large, x2
    expect(lineTotal({ basePrice: 20000, optionDeltas: [3000, 2000], quantity: 2 })).toBe(50000);
  });

  it("uses the branch price instead of the base price", () => {
    expect(unitPrice({ basePrice: 20000, branchPrice: 22000, quantity: 1 })).toBe(22000);
    expect(unitPrice({ basePrice: 20000, branchPrice: null, quantity: 1 })).toBe(20000);
  });

  it("allows negative option changes but not a negative unit price", () => {
    expect(unitPrice({ basePrice: 20000, optionDeltas: [-1500], quantity: 1 })).toBe(18500);
    expect(() => unitPrice({ basePrice: 1000, optionDeltas: [-2000], quantity: 1 })).toThrow(RangeError);
  });

  it("rejects bad quantities", () => {
    expect(() => lineTotal({ basePrice: 1000, quantity: 0 })).toThrow(RangeError);
    expect(() => lineTotal({ basePrice: 1000, quantity: 1.5 })).toThrow(RangeError);
  });
});

describe("computeDiscount", () => {
  it("applies a percentage with its cap", () => {
    const rule = { kind: "percent", percentBps: 1000, capPaise: 5000 } as const;
    expect(computeDiscount(40000, rule).discount).toBe(4000); // 10% of Rs 400
    expect(computeDiscount(100000, rule).discount).toBe(5000); // capped at Rs 50
  });

  it("applies a flat amount but never more than the subtotal", () => {
    const rule = { kind: "flat", amountPaise: 15000 } as const;
    expect(computeDiscount(40000, rule).discount).toBe(15000);
    expect(computeDiscount(9000, rule).discount).toBe(9000);
  });

  it("is ineligible below the minimum order", () => {
    const rule = { kind: "flat", amountPaise: 5000, minOrderPaise: 30000 } as const;
    expect(computeDiscount(29999, rule)).toEqual({ discount: 0, applied: false, reason: "BELOW_MIN_ORDER" });
    expect(computeDiscount(30000, rule).discount).toBe(5000);
  });

  it("returns zero with no rule", () => {
    expect(computeDiscount(40000, null)).toEqual({ discount: 0, applied: false });
  });
});

describe("fees", () => {
  it("charges Rs 40 delivery under Rs 500 and nothing from Rs 500", () => {
    expect(deliveryFee("delivery", 49999)).toBe(4000);
    expect(deliveryFee("delivery", 50000)).toBe(0);
  });

  it("has no delivery or packaging fee on pickup", () => {
    expect(deliveryFee("pickup", 10000)).toBe(0);
    expect(packagingFee("pickup")).toBe(0);
    expect(packagingFee("delivery")).toBe(1000);
  });

  it("calculates GST on subtotal minus discount", () => {
    expect(computeGst(40000, 4000)).toBe(1800);
  });
});

describe("loyalty and gift cards", () => {
  it("caps loyalty at 20% of the discounted subtotal", () => {
    expect(redeemLoyalty(10000, 36000)).toBe(7200);
    expect(redeemLoyalty(5000, 36000)).toBe(5000);
    expect(redeemLoyalty(0, 36000)).toBe(0);
  });

  it("applies the gift card up to the amount due", () => {
    expect(applyGiftCard(5000, 38100)).toBe(5000);
    expect(applyGiftCard(50000, 38100)).toBe(38100);
  });
});

describe("computeTotals", () => {
  it("follows the fixed order for a delivery order with every adjustment", () => {
    const totals = computeTotals({
      mode: "delivery",
      lines: [{ lineTotal: 25000 }, { lineTotal: 15000 }], // Rs 400
      discountRule: { kind: "percent", percentBps: 1000, capPaise: 5000 },
      serviceFee: 500,
      tip: 2000,
      loyaltyRequested: 10000,
      giftCardBalance: 5000,
    });

    expect(totals).toEqual({
      linesTotal: 40000,
      bundleSavings: 0,
      subtotal: 40000,
      discount: 4000,
      discountedSubtotal: 36000,
      gst: 1800,
      deliveryFee: 4000,
      packagingFee: 1000,
      serviceFee: 500,
      tip: 2000,
      loyaltyRedeemed: 7200,
      giftCardApplied: 5000,
      grandTotal: 33100,
    });
  });

  it("has no delivery fee on a Rs 600 pickup order", () => {
    const totals = computeTotals({ mode: "pickup", lines: [{ lineTotal: 60000 }] });
    expect(totals.gst).toBe(3000);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.packagingFee).toBe(0);
    expect(totals.grandTotal).toBe(63000);
  });

  it("subtracts bundle savings before the discount", () => {
    const totals = computeTotals({
      mode: "pickup",
      lines: [{ lineTotal: 50000 }],
      bundleSavings: 10000,
      discountRule: { kind: "flat", amountPaise: 5000, minOrderPaise: 45000 },
    });
    expect(totals.subtotal).toBe(40000);
    // 40000 is under the Rs 450 minimum, so the offer does not apply
    expect(totals.discount).toBe(0);
    expect(totals.discountReason).toBe("BELOW_MIN_ORDER");
  });

  it("tips are not discounted or taxed", () => {
    const withTip = computeTotals({ mode: "pickup", lines: [{ lineTotal: 20000 }], tip: 3000 });
    const without = computeTotals({ mode: "pickup", lines: [{ lineTotal: 20000 }] });
    expect(withTip.gst).toBe(without.gst);
    expect(withTip.grandTotal - without.grandTotal).toBe(3000);
  });

  it("returns zeros for an empty cart", () => {
    const totals = computeTotals({ mode: "delivery", lines: [], tip: 2000, serviceFee: 500 });
    expect(totals.grandTotal).toBe(0);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.packagingFee).toBe(0);
  });

  it("never lets the grand total go below zero", () => {
    const totals = computeTotals({
      mode: "pickup",
      lines: [{ lineTotal: 10000 }],
      giftCardBalance: 1000000,
    });
    expect(totals.giftCardApplied).toBe(10500);
    expect(totals.grandTotal).toBe(0);
  });

  it("keeps the grand total equal to the sum of its parts", () => {
    const mixes = [
      { mode: "delivery", lineTotal: 12345, tip: 777, loyalty: 999, gift: 123 },
      { mode: "pickup", lineTotal: 99999, tip: 0, loyalty: 5000, gift: 0 },
      { mode: "delivery", lineTotal: 49999, tip: 100, loyalty: 0, gift: 99999 },
    ] as const;

    for (const m of mixes) {
      const t = computeTotals({
        mode: m.mode,
        lines: [{ lineTotal: m.lineTotal }],
        discountRule: { kind: "percent", percentBps: 1500, capPaise: 8000 },
        serviceFee: 300,
        tip: m.tip,
        loyaltyRequested: m.loyalty,
        giftCardBalance: m.gift,
      });
      const expected =
        t.discountedSubtotal + t.gst + t.deliveryFee + t.packagingFee + t.serviceFee + t.tip -
        t.loyaltyRedeemed - t.giftCardApplied;
      expect(t.grandTotal).toBe(expected);
      expect(t.grandTotal).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects non-integer amounts", () => {
    expect(() => computeTotals({ mode: "pickup", lines: [{ lineTotal: 100.5 }] })).toThrow(RangeError);
  });
});
