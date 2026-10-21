import { Order } from "./order.model.js";
import { Cart } from "../cart/cart.model.js";
import { computeTotals } from "@biteverse/shared";
import type { Paise } from "@biteverse/shared";
import crypto from "crypto";

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

  const totals = computeTotals({ mode, lines });

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
    idempotencyKey,
  });

  await order.save();
  await Cart.updateOne({ userId }, { items: [] });
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
