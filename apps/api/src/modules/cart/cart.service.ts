import { Cart } from "./cart.model.js";
import { computeTotals } from "@biteverse/shared";
import type { Paise } from "@biteverse/shared";

export async function getCart(userId: string, restaurantSlug?: string) {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    return {
      items: [],
      subtotalInr: 0,
      gstInr: 0,
      deliveryFeeInr: 0,
      packagingInr: 0,
      totalInr: 0,
      restaurantSlug: restaurantSlug || null,
    };
  }

  return computeCartTotals(cart.items as any[], cart.restaurantSlug, "delivery");
}

export async function addToCart(
  userId: string,
  restaurantSlug: string,
  menuItemName: string,
  quantity: number,
  priceInr: number,
) {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, restaurantSlug, items: [] });
  } else if (cart.restaurantSlug !== restaurantSlug) {
    cart.items.splice(0);
    cart.restaurantSlug = restaurantSlug;
  }

  const items = cart.items as any[];
  const itemIndex = items.findIndex((item) => item.menuItemName === menuItemName);
  if (itemIndex > -1) {
    items[itemIndex].quantity += quantity;
  } else {
    items.push({ menuItemName, quantity, priceInr });
  }

  await cart.save();
  return computeCartTotals(cart.items as any[], cart.restaurantSlug, "delivery");
}

export async function updateCartItem(userId: string, menuItemName: string, quantity: number) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const items = cart.items as any[];
  if (quantity === 0) {
    const idx = items.findIndex((item) => item.menuItemName === menuItemName);
    if (idx > -1) items.splice(idx, 1);
  } else {
    const item = items.find((item) => item.menuItemName === menuItemName);
    if (!item) throw new Error("Item not found in cart");
    item.quantity = quantity;
  }

  await cart.save();
  return computeCartTotals(cart.items as any[], cart.restaurantSlug, "delivery");
}

export async function removeFromCart(userId: string, menuItemName: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const items = cart.items as any[];
  const idx = items.findIndex((item) => item.menuItemName === menuItemName);
  if (idx > -1) items.splice(idx, 1);
  
  await cart.save();
  return computeCartTotals(cart.items as any[], cart.restaurantSlug, "delivery");
}

export async function clearCart(userId: string) {
  await Cart.updateOne({ userId }, { items: [] });
}

function computeCartTotals(items: any[], restaurantSlug: string, mode: "delivery" | "pickup") {
  const lines = items.map((item) => ({
    lineTotal: (item.priceInr * item.quantity) as Paise,
  }));

  const totals = computeTotals({
    mode,
    lines,
  });

  return {
    items: items.map((item) => ({
      restaurantSlug,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      priceInr: item.priceInr,
    })),
    subtotalInr: totals.subtotal,
    gstInr: totals.gst,
    deliveryFeeInr: totals.deliveryFee,
    packagingInr: totals.packagingFee,
    totalInr: totals.grandTotal,
    restaurantSlug,
  };
}
