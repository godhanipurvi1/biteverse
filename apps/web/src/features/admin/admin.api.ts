import { api } from "@/lib/api/client";

export type AdminOrder = {
  _id: string;
  restaurantSlug: string;
  mode: "delivery" | "pickup";
  status: string;
  address?: string;
  totalInr: number;
  createdAt: string;
  items: { menuItemName: string; quantity: number; priceInr: number }[];
  userId: { name: string; email: string; phone: string } | null;
};

export type AdminStats = {
  byStatus: Record<string, number>;
  total: number;
  today: { orders: number; revenueInr: number };
};

export const ORDER_STATUSES = ["received", "accepted", "preparing", "out-for-delivery", "delivered"];

// Mirrors the API rule: one step forward, and pickup orders skip out-for-delivery.
export function nextStatus(status: string, mode: "delivery" | "pickup"): string | null {
  const steps = mode === "pickup" ? ORDER_STATUSES.filter((s) => s !== "out-for-delivery") : ORDER_STATUSES;
  const i = steps.indexOf(status);
  return i === -1 ? null : (steps[i + 1] ?? null);
}

export const inr = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export const getAdminStats = () => api<AdminStats>("/admin/stats");

export const getAdminOrders = (status?: string) =>
  api<{ orders: AdminOrder[] }>(`/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`);

export const setOrderStatus = (id: string, status: string) =>
  api<{ order: AdminOrder }>(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } });
