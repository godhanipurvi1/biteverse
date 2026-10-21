type Mode = "delivery" | "pickup";

async function parse(res: Response, fallback: string) {
  if (res.ok) return res.json();
  const data = await res.json().catch(() => null);
  throw new Error(data && typeof data.error === "string" ? data.error : fallback);
}

const json = { "Content-Type": "application/json" };

export async function getCart(mode: Mode = "delivery") {
  return parse(await fetch(`/api/cart?mode=${mode}`), "Failed to fetch cart");
}

export async function addToCart(restaurantSlug: string, menuItemName: string, quantity: number, priceInr: number) {
  const res = await fetch("/api/cart/add", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ restaurantSlug, menuItemName, quantity, priceInr }),
  });
  return parse(res, "Failed to add to cart");
}

export async function updateCartItem(menuItemName: string, quantity: number) {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(menuItemName)}`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify({ quantity }),
  });
  return parse(res, "Failed to update cart");
}

export async function removeFromCart(menuItemName: string) {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(menuItemName)}`, { method: "DELETE" });
  return parse(res, "Failed to remove from cart");
}

export async function applyCoupon(code: string, mode: Mode) {
  const res = await fetch("/api/cart/coupon", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ code, mode }),
  });
  return parse(res, "Could not apply the coupon");
}

export async function removeCoupon(mode: Mode) {
  return parse(await fetch(`/api/cart/coupon?mode=${mode}`, { method: "DELETE" }), "Could not remove the coupon");
}

export async function getOffers() {
  const data = await parse(await fetch("/api/offers"), "Failed to load offers");
  return data.offers as any[];
}

export async function createOrder(restaurantSlug: string, mode: Mode, address?: string) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { ...json, "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ restaurantSlug, mode, address }),
  });
  return parse(res, "Failed to create order");
}

export async function getOrders() {
  return parse(await fetch("/api/orders"), "Failed to fetch orders");
}

export async function getOrder(id: string) {
  return parse(await fetch(`/api/orders/${id}`), "Failed to fetch order");
}
