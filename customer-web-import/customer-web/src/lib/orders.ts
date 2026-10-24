"use client";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// The cart page builds this shape. It is translated to the server's format here.
export type OrderPayload = {
  restaurantId: string;
  customer: { name: string; mobile: string };
  deliveryAddress: string;
  instructions: string;
  paymentMethod: "upi" | "card" | "cod";
  offerCode: string | null;
  items: { dishId: string; qty: number }[];
};

// Sends one restaurant's order. Returns the tracking code.
export async function createOrder(payload: OrderPayload): Promise<string> {
  const body = {
    customer: {
      name: payload.customer.name,
      phone: payload.customer.mobile,
      address: payload.deliveryAddress,
    },
    payment: payload.paymentMethod,
    couponCode: payload.offerCode,
    instructions: payload.instructions,
    items: payload.items.map((i) => ({
      restaurantId: payload.restaurantId,
      menuItemId: i.dishId,
      qty: i.qty,
    })),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof json?.message === "string" ? json.message : `Order could not be placed (${res.status}).`;
    throw new Error(message);
  }

  const trackingCode = json?.trackingCode;
  if (typeof trackingCode !== "string" || !trackingCode) {
    throw new Error("The server did not return a tracking code.");
  }
  return trackingCode;
}

export const TOKEN_KEY = "biteverse-token";

export class AuthError extends Error {}
