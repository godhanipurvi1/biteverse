import { computeDiscount, type DiscountRule, type Paise } from "@biteverse/shared";
import { HttpError } from "../../lib/errors.js";
import { Offer } from "./offer.model.js";

type RuleSource = {
  type: string;
  value: number;
  minSubtotalInr?: number | null;
  maxDiscountInr?: number | null;
};

// Turns a stored coupon into the shared pricing rule, so the cart and the
// saved order use exactly the same discount maths.
export function toRule(offer: RuleSource): DiscountRule {
  const min = (offer.minSubtotalInr ?? 0) as Paise;
  const minPart = min > 0 ? { minOrderPaise: min } : {};
  if (offer.type === "percent") {
    const cap = offer.maxDiscountInr ?? 0;
    return {
      kind: "percent",
      percentBps: offer.value * 100,
      ...(cap > 0 ? { capPaise: cap as Paise } : {}),
      ...minPart,
    };
  }
  return { kind: "flat", amountPaise: offer.value as Paise, ...minPart };
}

export async function listActiveOffers() {
  return Offer.find({
    active: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .lean();
}

// Returns the coupon only if it exists, is switched on and has not expired.
export async function activeOfferByCode(code: string) {
  const offer = await Offer.findOne({ code: code.trim().toUpperCase() });
  if (!offer || !offer.active) return null;
  if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) return null;
  return offer;
}

export async function findUsableOffer(code: string, subtotalInr: number) {
  const offer = await activeOfferByCode(code);
  if (!offer) throw new HttpError(400, "This coupon code is not valid");
  if (subtotalInr < offer.minSubtotalInr) {
    const more = ((offer.minSubtotalInr - subtotalInr) / 100).toFixed(2);
    throw new HttpError(400, `Add ₹${more} more to use this coupon`);
  }
  const { discount } = computeDiscount(subtotalInr as Paise, toRule(offer));
  return { offer, discountInr: discount };
}
