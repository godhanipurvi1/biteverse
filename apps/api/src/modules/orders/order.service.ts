import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { computeTotals } from "@biteverse/shared";
import type { Paise } from "@biteverse/shared";
import crypto from "crypto";
import { activeOfferByCode, toRule } from "../offers/offer.service.js";

export async function createOrder(
  userId: string,
  restaurantSlug: string,
  mode: "delivery" | "pickup",
  address: string | undefined,
  idempotencyKey: string,
) {
  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) return existingOrder;

  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const lines = cart.items.map((item) => ({
    lineTotal: (item.priceInr * item.quantity) as Paise,
  }));

  const offer = cart.couponCode ? await activeOfferByCode(cart.couponCode) : null;
  const totals = computeTotals({ mode, lines, discountRule: offer ? toRule(offer) : null });

  const order = new Order({
    userId,
    restaurantSlug,
    items: cart.items,
    mode,
    address: mode === "delivery" ? address : undefined,
    subtotalInr: totals.subtotal,
    gstInr: totals.gst,
    deliveryFeeInr: totals.deliveryFee,
    packagingInr: totals.packagingFee,
    totalInr: totals.grandTotal,
    couponCode: offer && totals.discount > 0 ? offer.code : undefined,
    discountInr: totals.discount,
    idempotencyKey,
  });

  await order.save();
  await Cart.updateOne({ userId }, { items: [], $unset: { couponCode: 1 } });
  return order;
}

export async function getOrders(userId: string) {
  return Order.find({ userId }).sort({ createdAt: -1 });
}

export async function getOrder(userId: string, orderId: string) {
  return Order.findOne({ _id: orderId, userId });
}

export async function updateOrderStatus(orderId: string, status: string) {
  return Order.findByIdAndUpdate(orderId, { status }, { new: true });
}
