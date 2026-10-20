import { assertNonNegativePaise } from "../money/paise.js";
import type { Paise } from "../money/paise.js";
import { computeDiscount } from "./discount.js";
import type { DiscountRule } from "./discount.js";
import { deliveryFee, packagingFee } from "./delivery-fee.js";
import type { OrderMode } from "../orders/order-status.js";
import { computeGst } from "./gst.js";
import { redeemLoyalty } from "./loyalty.js";
import { applyGiftCard } from "./gift-card.js";

export interface CartLine {
  lineTotal: Paise;
}

export interface TotalsInput {
  mode: OrderMode;
  lines: readonly CartLine[];
  bundleSavings?: Paise;
  discountRule?: DiscountRule | null;
  serviceFee?: Paise;
  tip?: Paise;
  loyaltyRequested?: Paise;
  giftCardBalance?: Paise;
}

export interface Totals {
  linesTotal: Paise;
  bundleSavings: Paise;
  subtotal: Paise;
  discount: Paise;
  discountedSubtotal: Paise;
  gst: Paise;
  deliveryFee: Paise;
  packagingFee: Paise;
  serviceFee: Paise;
  tip: Paise;
  loyaltyRedeemed: Paise;
  giftCardApplied: Paise;
  grandTotal: Paise;
  discountReason?: string;
}

// Fixed order: lines, bundles, discount, GST, delivery, packaging, service fee,
// tip, loyalty, gift card. Tip is never discounted or taxed.
export function computeTotals(input: TotalsInput): Totals {
  const bundleSavings = input.bundleSavings ?? 0;
  const serviceFee = input.serviceFee ?? 0;
  const tip = input.tip ?? 0;
  const loyaltyRequested = input.loyaltyRequested ?? 0;
  const giftCardBalance = input.giftCardBalance ?? 0;

  for (const line of input.lines) {
    assertNonNegativePaise(line.lineTotal);
  }
  assertNonNegativePaise(bundleSavings);
  assertNonNegativePaise(serviceFee);
  assertNonNegativePaise(tip);
  assertNonNegativePaise(loyaltyRequested);
  assertNonNegativePaise(giftCardBalance);

  if (input.lines.length === 0) {
    return {
      linesTotal: 0,
      bundleSavings: 0,
      subtotal: 0,
      discount: 0,
      discountedSubtotal: 0,
      gst: 0,
      deliveryFee: 0,
      packagingFee: 0,
      serviceFee: 0,
      tip: 0,
      loyaltyRedeemed: 0,
      giftCardApplied: 0,
      grandTotal: 0,
    };
  }

  const linesTotal = input.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (bundleSavings > linesTotal) {
    throw new RangeError("bundle savings cannot be more than the lines total");
  }
  const subtotal = linesTotal - bundleSavings;
  const discountResult = computeDiscount(subtotal, input.discountRule ?? null);
  const discount = discountResult.discount;
  const discountedSubtotal = subtotal - discount;
  const gst = computeGst(subtotal, discount);
  const delivery = deliveryFee(input.mode, discountedSubtotal);
  const packaging = packagingFee(input.mode);
  const loyaltyRedeemed = redeemLoyalty(loyaltyRequested, discountedSubtotal);
  const amountDue =
    discountedSubtotal + gst + delivery + packaging + serviceFee + tip - loyaltyRedeemed;
  const giftCardApplied = applyGiftCard(giftCardBalance, amountDue);
  const grandTotal = amountDue - giftCardApplied;

  const totals: Totals = {
    linesTotal,
    bundleSavings,
    subtotal,
    discount,
    discountedSubtotal,
    gst,
    deliveryFee: delivery,
    packagingFee: packaging,
    serviceFee,
    tip,
    loyaltyRedeemed,
    giftCardApplied,
    grandTotal,
  };
  if (discountResult.reason !== undefined) {
    totals.discountReason = discountResult.reason;
  }
  return totals;
}
