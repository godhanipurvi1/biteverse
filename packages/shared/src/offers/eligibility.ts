import type { Paise } from "../money/paise.js";

export type OfferType = "percent" | "flat" | "freeDelivery" | "bogo" | "combo" | "paymentMethod";

export interface Offer {
  id: string;
  code: string;
  type: OfferType;
  value: number; // percentage (1-100) or flat amount in paise
  minOrderPaise: Paise;
  maxDiscountPaise: Paise;
  startsAt: Date;
  endsAt: Date;
  firstOrderOnly: boolean;
  usageLimitPerUser: number | null; // null means unlimited
  usageLimitTotal: number | null;
  usedCountTotal: number;
  brandIds: string[]; // empty means all brands
  branchIds: string[]; // empty means all branches
  categoryIds: string[]; // empty means all categories
}

export interface OfferEligibility {
  eligible: boolean;
  reason?: string; // e.g., "Offer expired" or "Add ₹80 more to use this offer"
}

export function isOfferExpired(offer: Offer, now: Date = new Date()): boolean {
  return now > offer.endsAt;
}

export function isOfferActive(offer: Offer, now: Date = new Date()): boolean {
  return now >= offer.startsAt && now <= offer.endsAt;
}

export function isOfferFirstOrderOnly(offer: Offer): boolean {
  return offer.firstOrderOnly;
}

export function isUsageLimitExceeded(
  offer: Offer,
  userUsageCount: number = 0,
): boolean {
  if (offer.usageLimitPerUser !== null && userUsageCount >= offer.usageLimitPerUser) {
    return true;
  }
  if (offer.usageLimitTotal !== null && offer.usedCountTotal >= offer.usageLimitTotal) {
    return true;
  }
  return false;
}

export function isMinOrderMet(offer: Offer, subtotalPaise: Paise): boolean {
  return subtotalPaise >= offer.minOrderPaise;
}

export function checkOfferEligibility(
  offer: Offer,
  input: {
    subtotalPaise: Paise;
    isFirstOrder: boolean;
    userUsageCount?: number;
    now?: Date;
  },
): OfferEligibility {
  const { subtotalPaise, isFirstOrder, userUsageCount = 0, now = new Date() } = input;

  if (!isOfferActive(offer, now)) {
    return { eligible: false, reason: "Offer expired" };
  }

  if (offer.firstOrderOnly && !isFirstOrder) {
    return { eligible: false, reason: "This offer is for first orders only" };
  }

  if (isUsageLimitExceeded(offer, userUsageCount)) {
    return { eligible: false, reason: "You have used this offer the maximum number of times" };
  }

  if (!isMinOrderMet(offer, subtotalPaise)) {
    const needed = offer.minOrderPaise - subtotalPaise;
    return { eligible: false, reason: `Add \u20B9${(needed / 100).toFixed(0)} more to use this offer` };
  }

  return { eligible: true };
}

export interface CartOfferContext {
  subtotalPaise: Paise;
  isFirstOrder: boolean;
  userUsageCount: Map<string, number>; // offerId -> count
}

export function calculateOfferDiscount(offer: Offer, subtotalPaise: Paise): Paise {
  if (offer.type === "percent") {
    const raw = Math.floor((subtotalPaise * offer.value) / 100);
    return Math.min(raw, offer.maxDiscountPaise);
  }
  if (offer.type === "flat") {
    return Math.min(offer.value, offer.maxDiscountPaise, subtotalPaise);
  }
  if (offer.type === "freeDelivery") {
    // Free delivery discount is handled separately in pricing
    return 0;
  }
  return 0;
}

export function bestOfferForCart(
  offers: readonly Offer[],
  context: CartOfferContext,
  now: Date = new Date(),
): Offer | null {
  const eligible: Array<{ offer: Offer; discount: Paise }> = [];

  for (const offer of offers) {
    const check = checkOfferEligibility(offer, {
      subtotalPaise: context.subtotalPaise,
      isFirstOrder: context.isFirstOrder,
      userUsageCount: context.userUsageCount.get(offer.id) ?? 0,
      now,
    });

    if (check.eligible) {
      const discount = calculateOfferDiscount(offer, context.subtotalPaise);
      eligible.push({ offer, discount });
    }
  }

  if (eligible.length === 0) {
    return null;
  }

  // Sort by discount (descending), then by end date (ascending)
  eligible.sort((a, b) => {
    if (a.discount !== b.discount) {
      return b.discount - a.discount;
    }
    return a.offer.endsAt.getTime() - b.offer.endsAt.getTime();
  });

  const best = eligible[0];
  if (!best) {
    return null;
  }
  return best.offer;
}