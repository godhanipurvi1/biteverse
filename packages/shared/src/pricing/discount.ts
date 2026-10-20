import { assertNonNegativePaise, percentOf } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

export type DiscountRule =
  | { kind: "percent"; percentBps: number; capPaise?: Paise; minOrderPaise?: Paise }
  | { kind: "flat"; amountPaise: Paise; minOrderPaise?: Paise };

export interface DiscountResult {
  discount: Paise;
  applied: boolean;
  reason?: string;
}

// Discount is never more than the subtotal, and zero below the minimum order.
export function computeDiscount(subtotalPaise: Paise, rule: DiscountRule | null): DiscountResult {
  assertNonNegativePaise(subtotalPaise);
  if (rule === null) {
    return { discount: 0, applied: false };
  }
  if (rule.minOrderPaise !== undefined && subtotalPaise < rule.minOrderPaise) {
    return { discount: 0, applied: false, reason: "BELOW_MIN_ORDER" };
  }
  let raw: Paise;
  if (rule.kind === "percent") {
    raw = percentOf(subtotalPaise, rule.percentBps);
    if (rule.capPaise !== undefined) {
      raw = Math.min(raw, rule.capPaise);
    }
  } else {
    assertNonNegativePaise(rule.amountPaise);
    raw = rule.amountPaise;
  }
  const discount = Math.min(raw, subtotalPaise);
  return { discount, applied: discount > 0 };
}
