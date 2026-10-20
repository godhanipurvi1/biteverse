export type Paise = number;

export function isPaise(value: unknown): value is Paise {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function assertPaise(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`amount must be an integer number of paise, got ${String(value)}`);
  }
}

export function assertNonNegativePaise(value: number): void {
  assertPaise(value);
  if (value < 0) {
    throw new RangeError(`amount must not be negative, got ${value}`);
  }
}

export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) {
    throw new RangeError(`rupee amount must be a finite number, got ${String(rupees)}`);
  }
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: Paise): number {
  assertPaise(paise);
  return paise / 100;
}

// Percentage in basis points (500 = 5%), rounded half up to the paisa.
export function percentOf(amountPaise: Paise, bps: number): Paise {
  assertNonNegativePaise(amountPaise);
  if (!Number.isSafeInteger(bps) || bps < 0) {
    throw new RangeError(`basis points must be a non-negative integer, got ${String(bps)}`);
  }
  return Math.floor((amountPaise * bps + 5000) / 10000);
}
