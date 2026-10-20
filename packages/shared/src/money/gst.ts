import { assertPaise, percentOf } from "./paise.js";
import type { Paise } from "./paise.js";

export const GST_RATE_BPS = 500;

export function gstOn(amountPaise: Paise): Paise {
  assertPaise(amountPaise);
  if (amountPaise <= 0) {
    return 0;
  }
  return percentOf(amountPaise, GST_RATE_BPS);
}
