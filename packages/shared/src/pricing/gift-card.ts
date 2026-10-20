import { assertNonNegativePaise } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

// Applied last: never more than the balance, and never more than the amount due.
export function applyGiftCard(balancePaise: Paise, amountDuePaise: Paise): Paise {
  assertNonNegativePaise(balancePaise);
  assertNonNegativePaise(amountDuePaise);
  return Math.min(balancePaise, amountDuePaise);
}
