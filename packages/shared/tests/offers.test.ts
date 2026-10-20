import { describe, it, expect } from "vitest";
import {
  type Offer,
  bestOfferForCart,
  calculateOfferDiscount,
  checkOfferEligibility,
  isMinOrderMet,
  isOfferActive,
  isOfferExpired,
  isOfferFirstOrderOnly,
  isUsageLimitExceeded,
} from "../src/offers/eligibility";

// Fixed reference time so results never depend on the wall clock.
const NOW = new Date("2026-06-15T12:00:00Z");

function offer(overrides: Partial<Offer>): Offer {
  return {
    id: "offer-1",
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrderPaise: 10000,
    maxDiscountPaise: 50000,
    startsAt: new Date("2000-01-01"),
    endsAt: new Date("2099-12-31"),
    firstOrderOnly: false,
    usageLimitPerUser: null,
    usageLimitTotal: null,
    usedCountTotal: 0,
    brandIds: [],
    branchIds: [],
    categoryIds: [],
    ...overrides,
  };
}

describe("offer eligibility", () => {
  it("detects expired offers", () => {
    const expired = offer({ endsAt: new Date("2024-01-01") });
    const now = new Date("2024-01-02");
    expect(isOfferExpired(expired, now)).toBe(true);
    expect(isOfferActive(expired, now)).toBe(false);
  });

  it("detects active offers", () => {
    const active = offer({ startsAt: new Date("2024-01-01"), endsAt: new Date("2024-12-31") });
    const now = new Date("2024-06-15");
    expect(isOfferExpired(active, now)).toBe(false);
    expect(isOfferActive(active, now)).toBe(true);
  });

  it("detects first-order-only offers", () => {
    const firstOrder = offer({ firstOrderOnly: true });
    expect(isOfferFirstOrderOnly(firstOrder)).toBe(true);
  });

  it("checks minimum order requirement", () => {
    const ofr = offer({ minOrderPaise: 50000 });
    expect(isMinOrderMet(ofr, 40000)).toBe(false);
    expect(isMinOrderMet(ofr, 50000)).toBe(true);
    expect(isMinOrderMet(ofr, 60000)).toBe(true);
  });

  it("checks per-user usage limits", () => {
    const limited = offer({ usageLimitPerUser: 3 });
    expect(isUsageLimitExceeded(limited, 2)).toBe(false);
    expect(isUsageLimitExceeded(limited, 3)).toBe(true);
    expect(isUsageLimitExceeded(limited, 4)).toBe(true);
  });

  it("checks total usage limits", () => {
    const limited = offer({ usageLimitTotal: 100, usedCountTotal: 99 });
    expect(isUsageLimitExceeded(limited, 0)).toBe(false);

    const exhausted = offer({ usageLimitTotal: 100, usedCountTotal: 100 });
    expect(isUsageLimitExceeded(exhausted, 0)).toBe(true);
  });

  it("rejects first-order offers for returning customers", () => {
    const ofr = offer({ firstOrderOnly: true });
    const check = checkOfferEligibility(ofr, {
      subtotalPaise: 50000,
      isFirstOrder: false,
      now: NOW,
    });
    expect(check.eligible).toBe(false);
    expect(check.reason).toContain("first order");
  });

  it("rejects offers below minimum order with the correct amount needed", () => {
    const ofr = offer({ minOrderPaise: 50000 });
    const check = checkOfferEligibility(ofr, {
      subtotalPaise: 40000,
      isFirstOrder: true,
      now: NOW,
    });
    expect(check.eligible).toBe(false);
    expect(check.reason).toContain("Add");
    expect(check.reason).toContain("100"); // 100 rupees needed
  });

  it("approves eligible offers", () => {
    const ofr = offer({ minOrderPaise: 50000 });
    const check = checkOfferEligibility(ofr, {
      subtotalPaise: 60000,
      isFirstOrder: true,
      userUsageCount: 0,
      now: NOW,
    });
    expect(check.eligible).toBe(true);
    expect(check.reason).toBeUndefined();
  });
});

describe("offer discount calculation", () => {
  it("calculates percentage discounts", () => {
    const ofr = offer({ type: "percent", value: 15, maxDiscountPaise: 50000 });
    expect(calculateOfferDiscount(ofr, 100000)).toBe(15000);
  });

  it("caps percentage discounts at the max", () => {
    const ofr = offer({ type: "percent", value: 50, maxDiscountPaise: 20000 });
    expect(calculateOfferDiscount(ofr, 100000)).toBe(20000);
  });

  it("calculates flat discounts", () => {
    const ofr = offer({ type: "flat", value: 10000 });
    expect(calculateOfferDiscount(ofr, 100000)).toBe(10000);
  });

  it("caps flat discounts at the max and subtotal", () => {
    const ofr = offer({ type: "flat", value: 10000, maxDiscountPaise: 5000 });
    expect(calculateOfferDiscount(ofr, 100000)).toBe(5000);
    expect(calculateOfferDiscount(ofr, 3000)).toBe(3000);
  });

  it("returns 0 for free delivery type", () => {
    const ofr = offer({ type: "freeDelivery" });
    expect(calculateOfferDiscount(ofr, 100000)).toBe(0);
  });
});

describe("best offer for cart", () => {
  it("returns the largest discount", () => {
    const offers = [
      offer({ id: "offer-1", type: "percent", value: 10 }),
      offer({ id: "offer-2", type: "flat", value: 15000 }),
    ];
    const best = bestOfferForCart(
      offers,
      { subtotalPaise: 100000, isFirstOrder: true, userUsageCount: new Map() },
      NOW,
    );
    expect(best?.id).toBe("offer-2"); // 15000 > 10000
  });

  it("breaks ties by earliest end date", () => {
    const offers = [
      offer({ id: "offer-1", type: "flat", value: 10000, endsAt: new Date("2099-12-31") }),
      offer({ id: "offer-2", type: "flat", value: 10000, endsAt: new Date("2030-06-30") }),
    ];
    const best = bestOfferForCart(
      offers,
      { subtotalPaise: 100000, isFirstOrder: true, userUsageCount: new Map() },
      NOW,
    );
    expect(best?.id).toBe("offer-2"); // ends sooner
  });

  it("filters out ineligible offers", () => {
    const offers = [
      offer({ id: "offer-1", minOrderPaise: 50000 }),
      offer({ id: "offer-2", minOrderPaise: 200000 }), // too high
    ];
    const best = bestOfferForCart(
      offers,
      { subtotalPaise: 100000, isFirstOrder: true, userUsageCount: new Map() },
      NOW,
    );
    expect(best?.id).toBe("offer-1");
  });

  it("returns null when no offers are eligible", () => {
    const offers = [offer({ id: "offer-1", minOrderPaise: 200000 })];
    const best = bestOfferForCart(
      offers,
      { subtotalPaise: 100000, isFirstOrder: true, userUsageCount: new Map() },
      NOW,
    );
    expect(best).toBeNull();
  });

  it("respects first-order-only restrictions", () => {
    const offers = [
      offer({ id: "offer-1", firstOrderOnly: true }),
      offer({ id: "offer-2", firstOrderOnly: false }),
    ];
    const best = bestOfferForCart(
      offers,
      { subtotalPaise: 100000, isFirstOrder: false, userUsageCount: new Map() },
      NOW,
    );
    expect(best?.id).toBe("offer-2");
  });
});
