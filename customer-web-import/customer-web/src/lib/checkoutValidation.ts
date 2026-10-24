export const PAYMENT_METHODS = ["upi", "card", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const MAX_QTY = 10;
export const MAX_NAME = 50;
export const MAX_ADDRESS = 200;
export const MAX_INSTRUCTIONS = 200;
export const COD_LIMIT = 2000;
export const TAX_RATE = 0.05;

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export function validateName(value: string): string | null {
  const s = value.trim();
  if (!s) return "Enter your name.";
  if (s.length < 2) return "Name must be at least 2 characters.";
  if (s.length > MAX_NAME) return `Name must be ${MAX_NAME} characters or fewer.`;
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(s)) {
    return "Name can only contain letters, spaces, dots, apostrophes and hyphens.";
  }
  return null;
}

export function normalizeMobile(value: string): string {
  let s = value.replace(/[\s-]/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.length === 12 && s.startsWith("91")) s = s.slice(2);
  else if (s.length === 11 && s.startsWith("0")) s = s.slice(1);
  return s;
}

export function validateMobile(value: string): string | null {
  const s = normalizeMobile(value);
  if (!s) return "Enter your mobile number.";
  if (!/^\d+$/.test(s)) return "Mobile number can only contain digits.";
  if (s.length !== 10) return "Mobile number must be 10 digits.";
  if (!/^[6-9]/.test(s)) return "Enter a valid Indian mobile number (starts with 6, 7, 8 or 9).";
  return null;
}

export function validateAddress(value: string): string | null {
  const s = value.trim();
  if (!s) return "Enter your delivery address.";
  if (s.length < 10) return "Address is too short. Add house number, society and area.";
  if (s.length > MAX_ADDRESS) return `Address must be ${MAX_ADDRESS} characters or fewer.`;
  return null;
}

export function validateInstructions(value: string): string | null {
  if (value.length > MAX_INSTRUCTIONS) return `Instructions must be ${MAX_INSTRUCTIONS} characters or fewer.`;
  return null;
}

export function validateCartLines(lines: { name: string; qty: number; price: number }[]): string | null {
  if (lines.length === 0) return "Your cart is empty.";
  for (const l of lines) {
    if (!Number.isInteger(l.qty) || l.qty < 1) return `Quantity for ${l.name} must be at least 1.`;
    if (l.qty > MAX_QTY) return `You can order up to ${MAX_QTY} of ${l.name}.`;
    if (!(l.price > 0)) return `${l.name} has an invalid price.`;
  }
  return null;
}

export function validatePayment(method: string, total: number): string | null {
  if (!(PAYMENT_METHODS as readonly string[]).includes(method)) return "Choose a payment method.";
  if (method === "cod" && total > COD_LIMIT) {
    return `Cash on delivery is available up to ₹${COD_LIMIT}. Choose UPI or card instead.`;
  }
  return null;
}

// Offers come from the API, passed in by the caller.
export function validateCouponCode(
  code: string,
  subtotal: number,
  offers: Record<string, { minSubtotal: number }>
): string | null {
  const c = normalizeCode(code);
  if (!c) return "Enter a promo code.";
  const offer = offers[c];
  if (!offer) return "That code isn't valid or has expired.";
  if (subtotal < offer.minSubtotal) {
    return `Add ₹${offer.minSubtotal - subtotal} more to use ${c}.`;
  }
  return null;
}
