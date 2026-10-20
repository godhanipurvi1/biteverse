import { assertNonNegativePaise } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

export type OrderMode = "delivery" | "pickup";

export const DELIVERY_FEE_PAISE = 4000;
export const FREE_DELIVERY_FROM_PAISE = 50000;
export const PACKAGING_FEE_PAISE = 1000;

export function deliveryFee(mode: OrderMode, discountedSubtotalPaise: Paise): Paise {
  assertNonNegativePaise(discountedSubtotalPaise);
  if (mode === "pickup") {
    return 0;
  }
  return discountedSubtotalPaise < FREE_DELIVERY_FROM_PAISE ? DELIVERY_FEE_PAISE : 0;
}

export function packagingFee(mode: OrderMode): Paise {
  return mode === "delivery" ? PACKAGING_FEE_PAISE : 0;
}
