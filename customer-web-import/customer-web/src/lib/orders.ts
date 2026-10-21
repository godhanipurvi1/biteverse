// src/lib/orders.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// Must match the key the login page writes after sign-in.
export const TOKEN_KEY = "biteverse-token";

export const money = (n: number) => `\u20B9${n}`;

export type OrderLine = { name: string; qty: number; price?: number; lineTotal?: number };

export type Order = {
  _id: string;
  restaurantName?: string;
  status?: string;
  createdAt?: string;
  items?: OrderLine[];
  lines?: OrderLine[];
  subtotal?: number;
  discount?: number;
  fee?: number;
  total?: number;
  couponCode?: string | null;
  paymentMethod?: string;
  address?: string;
  cancelReason?: string;
  statusHistory?: { status: string; at?: string }[];
};

// Customer-facing steps, in order. Matches the admin status flow.
export const STEPS: string[] = [
  "placed",
  "confirmed",
  "preparing",
  "ready",
  "out for delivery",
  "delivered",
];

export const STEP_LABELS: Record<string, string> = {
  placed: "Order placed",
  confirmed: "Restaurant confirmed",
  preparing: "Preparing your food",
  ready: "Ready for pickup",
  "out for delivery": "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Accepts "out for delivery", "out_for_delivery" or "Out-for-delivery".
export function normaliseStatus(status?: string): string {
  return (status ?? "placed").toLowerCase().replace(/[_-]+/g, " ").trim();
}

export function isCancelled(status: string): boolean {
  return status === "cancelled" || status === "canceled";
}

export function isFinal(status: string): boolean {
  return status === "delivered" || isCancelled(status);
}

export function orderLines(order: Order): OrderLine[] {
  return order.items ?? order.lines ?? [];
}

export function formatWhen(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortId(id: string): string {
  return id.slice(-6);
}

export class AuthError extends Error {}

function authHeaders(): Record<string, string> {
  const token = window.localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, pick: (json: any) => T): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), cache: "no-store" });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running.");
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) throw new AuthError("Log in to see your orders.");
  if (!res.ok) throw new Error(json.message ?? "Something went wrong. Try again.");
  return pick(json);
}

// Handles both a bare array and a { data } wrapper.
export function fetchMyOrders(): Promise<Order[]> {
  return request("/api/orders", (json) =>
    Array.isArray(json) ? json : (json.data ?? json.orders ?? [])
  );
}

export function fetchOrder(id: string): Promise<Order> {
  return request(`/api/orders/${id}`, (json) => json.data ?? json.order ?? json);
}