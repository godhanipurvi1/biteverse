export async function getCart() {
  const res = await fetch("/api/cart");
  if (!res.ok) throw new Error("Failed to fetch cart");
  return res.json();
}

export async function addToCart(restaurantSlug: string, menuItemName: string, quantity: number, priceInr: number) {
  const res = await fetch("/api/cart/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantSlug, menuItemName, quantity, priceInr }),
  });
  if (!res.ok) throw new Error("Failed to add to cart");
  return res.json();
}

export async function updateCartItem(menuItemName: string, quantity: number) {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(menuItemName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error("Failed to update cart");
  return res.json();
}

export async function removeFromCart(menuItemName: string) {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(menuItemName)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove from cart");
  return res.json();
}

export async function createOrder(restaurantSlug: string, mode: "delivery" | "pickup", address?: string) {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ restaurantSlug, mode, address }),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function getOrders() {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getOrder(id: string) {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}
