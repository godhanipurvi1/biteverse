import { assertNonNegativePaise, percentOf } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

export const LOYALTY_CAP_BPS = 2000;

// Loyalty redemption is capped at 20% of the discounted subtotal.
export function redeemLoyalty(requestedPaise: Paise, discountedSubtotalPaise: Paise): Paise {
  assertNonNegativePaise(requestedPaise);
  assertNonNegativePaise(discountedSubtotalPaise);
  return Math.min(requestedPaise, percentOf(discountedSubtotalPaise, LOYALTY_CAP_BPS));
}
