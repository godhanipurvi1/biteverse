import { assertPaise } from "./paise.js";
import type { Paise } from "./paise.js";

const RUPEE_SIGN = "\u20B9";

export interface FormatINROptions {
  alwaysShowPaise?: boolean;
}

// Indian grouping: last three digits, then pairs (12,34,56,789).
function groupIndian(wholeRupees: number): string {
  const digits = String(wholeRupees);
  if (digits.length <= 3) {
    return digits;
  }
  const last = digits.slice(-3);
  let head = digits.slice(0, -3);
  const groups: string[] = [];
  while (head.length > 2) {
    groups.unshift(head.slice(-2));
    head = head.slice(0, -2);
  }
  if (head.length > 0) {
    groups.unshift(head);
  }
  groups.push(last);
  return groups.join(",");
}

export function formatINR(amountPaise: Paise, options: FormatINROptions = {}): string {
  assertPaise(amountPaise);
  const sign = amountPaise < 0 ? "-" : "";
  const absolute = Math.abs(amountPaise);
  const rupees = Math.floor(absolute / 100);
  const paise = absolute % 100;
  const showPaise = options.alwaysShowPaise === true || paise !== 0;
  const body = showPaise
    ? `${groupIndian(rupees)}.${String(paise).padStart(2, "0")}`
    : groupIndian(rupees);
  return `${sign}${RUPEE_SIGN}${body}`;
}
