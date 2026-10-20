import { assertNonNegativePaise, assertPaise } from "../money/paise.js";
import type { Paise } from "../money/paise.js";

export interface LineInput {
  basePrice: Paise;
  branchPrice?: Paise | null;
  optionDeltas?: readonly Paise[];
  quantity: number;
}

// Price of one unit: branch price (if set) plus option changes.
export function unitPrice(input: LineInput): Paise {
  assertNonNegativePaise(input.basePrice);
  const base = input.branchPrice ?? input.basePrice;
  assertNonNegativePaise(base);
  let total = base;
  for (const delta of input.optionDeltas ?? []) {
    assertPaise(delta);
    total += delta;
  }
  if (total < 0) {
    throw new RangeError("unit price cannot be negative");
  }
  return total;
}

export function lineTotal(input: LineInput): Paise {
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) {
    throw new RangeError(`quantity must be a positive integer, got ${String(input.quantity)}`);
  }
  return unitPrice(input) * input.quantity;
}
