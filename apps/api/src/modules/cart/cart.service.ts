import { Cart } from "./cart.model.js";
import { computeTotals } from "@biteverse/shared";
import type { Paise } from "@biteverse/shared";
import { HttpError } from "../../lib/errors.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { activeOfferByCode, findUsableOffer, toRule } from "../offers/offer.service.js";

export type CartMode = "delivery" | "pickup";

type CartLike = { items: any[]; restaurantSlug: string; couponCode?: string | null };

const view = (cart: any): CartLike => ({
  items: cart.items as any[],
  restaurantSlug: cart.restaurantSlug,
  couponCode: cart.couponCode,
});

const emptyCart = {
  items: [],
  subtotalInr: 0,
  discountInr: 0,
  gstInr: 0,
  deliveryFeeInr: 0,
  packagingInr: 0,
  totalInr: 0,
  couponCode: null as string | null,
  couponNote: null as string | null,
  restaurantSlug: null as string | null,
};

export async function getCart(userId: string, mode: CartMode = "delivery") {
  const cart = await Cart.findOne({ userId });
  if (!cart) return emptyCart;
  return priceCart(view(cart), mode);
}

export async function addToCart(
  userId: string,
  restaurantSlug: string,
  menuItemName: string,
  quantity: number,
  _clientPriceInr: number,
) {
  // The price always comes from the menu, never from the browser.
  const restaurant = await Restaurant.findOne({ slug: restaurantSlug }).lean();
  const menuItem = (restaurant?.menu as any[] | undefined)?.find((m) => m.name === menuItemName);
  if (!menuItem || menuItem.available === false) throw new HttpError(400, "That item is not available");
  const priceInr: number = menuItem.priceInr;

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
  return priceCart(view(cart), "delivery");
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
  return priceCart(view(cart), "delivery");
}

export async function removeFromCart(userId: string, menuItemName: string) {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Cart not found");

  const items = cart.items as any[];
  const idx = items.findIndex((item) => item.menuItemName === menuItemName);
  if (idx > -1) items.splice(idx, 1);

  await cart.save();
  return priceCart(view(cart), "delivery");
}

export async function clearCart(userId: string) {
  await Cart.updateOne({ userId }, { items: [] });
}

export async function applyCoupon(userId: string, code: string, mode: CartMode) {
  const cart = await Cart.findOne({ userId });
  if (!cart || cart.items.length === 0) throw new HttpError(400, "Your cart is empty");
  const subtotal = (cart.items as any[]).reduce((sum, i) => sum + i.priceInr * i.quantity, 0);
  const { offer } = await findUsableOffer(code, subtotal);
  cart.couponCode = offer.code;
  await cart.save();
  return priceCart(view(cart), mode);
}

export async function removeCoupon(userId: string, mode: CartMode) {
  await Cart.updateOne({ userId }, { $unset: { couponCode: 1 } });
  return getCart(userId, mode);
}

async function priceCart(cart: CartLike, mode: CartMode) {
  const offer = cart.couponCode ? await activeOfferByCode(cart.couponCode) : null;
  const lines = cart.items.map((item) => ({
    lineTotal: (item.priceInr * item.quantity) as Paise,
  }));

  const totals = computeTotals({ mode, lines, discountRule: offer ? toRule(offer) : null });

  return {
    items: cart.items.map((item) => ({
      restaurantSlug: cart.restaurantSlug,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      priceInr: item.priceInr,
    })),
    subtotalInr: totals.subtotal,
    discountInr: totals.discount,
    gstInr: totals.gst,
    deliveryFeeInr: totals.deliveryFee,
    packagingInr: totals.packagingFee,
    totalInr: totals.grandTotal,
    couponCode: offer ? offer.code : null,
    couponNote:
      totals.discountReason === "BELOW_MIN_ORDER" ? "Add more items to reach this coupon's minimum order" : null,
    restaurantSlug: cart.restaurantSlug,
  };
}
