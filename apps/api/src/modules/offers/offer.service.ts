import { HttpError } from "../../lib/errors.js";
import { Offer } from "./offer.model.js";

type DiscountRule = { type: string; value: number; maxDiscountInr?: number | null };

// Discount in paise, taken off the subtotal. Never more than the subtotal itself.
export function calcDiscount(offer: DiscountRule, subtotalInr: number): number {
  let discount = offer.type === "percent" ? Math.floor((subtotalInr * offer.value) / 100) : offer.value;
  if (offer.type === "percent" && offer.maxDiscountInr) discount = Math.min(discount, offer.maxDiscountInr);
  return Math.max(0, Math.min(discount, subtotalInr));
}

export async function listActiveOffers() {
  return Offer.find({ active: true, $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }] })
    .sort({ createdAt: -1 })
    .lean();
}

// Checks a code against a subtotal. Used by the validate endpoint and, next, by checkout.
export async function findUsableOffer(code: string, subtotalInr: number) {
  const offer = await Offer.findOne({ code: code.trim().toUpperCase() });
  const expired = offer?.expiresAt ? offer.expiresAt.getTime() <= Date.now() : false;
  if (!offer || !offer.active || expired) throw new HttpError(400, "This coupon code is not valid");
  if (subtotalInr < offer.minSubtotalInr) {
    const more = ((offer.minSubtotalInr - subtotalInr) / 100).toFixed(2);
    throw new HttpError(400, `Add ₹${more} more to use this coupon`);
  }
  return { offer, discountInr: calcDiscount(offer, subtotalInr) };
}
