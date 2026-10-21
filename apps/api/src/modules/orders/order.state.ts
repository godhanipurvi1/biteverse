export const ORDER_STATUSES = [
  "received",
  "accepted",
  "preparing",
  "out-for-delivery",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

// Orders move forward one step at a time. Pickup orders have no delivery leg.
export function canTransition(from: OrderStatus, to: OrderStatus, mode: "delivery" | "pickup") {
  const steps: readonly OrderStatus[] = mode === "pickup" ? ORDER_STATUSES.filter((s) => s !== "out-for-delivery") : ORDER_STATUSES;
  const i = steps.indexOf(from);
  return i !== -1 && steps[i + 1] === to;
}
