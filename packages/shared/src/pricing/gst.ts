import { gstOn } from "../money/gst.js";
import { assertNonNegativePaise } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

// GST applies to subtotal minus discount only.
export function computeGst(subtotalPaise: Paise, discountPaise: Paise): Paise {
  assertNonNegativePaise(subtotalPaise);
  assertNonNegativePaise(discountPaise);
  return gstOn(Math.max(0, subtotalPaise - discountPaise));
}
