// Order lifecycle for BiteVerse: statuses, the transition map for each order mode,
// and cancellation refunds. Rules come from the BUSINESS RULES and tracking stages in the spec.
// No imports on purpose, so this file works with any module setup.

export const ORDER_MODES = ["delivery", "pickup"] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const ORDER_STATUSES = [
  "received",
  "accepted",
  "being_prepared",
  "quality_check",
  "out_for_delivery",
  "delivered",
  "ready_for_pickup",
  "picked_up",
  "rejected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Readonly<Record<OrderStatus, string>> = {
  received: "Order received",
  accepted: "Accepted",
  being_prepared: "Being prepared",
  quality_check: "Quality check and packing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ORDER_ERROR_CODES = ["INVALID_ORDER_TRANSITION", "ORDER_NOT_CANCELLABLE"] as const;
export type OrderErrorCode = (typeof ORDER_ERROR_CODES)[number];

export class OrderRuleError extends Error {
  readonly code: OrderErrorCode;

  constructor(code: OrderErrorCode, message: string) {
    super(message);
    this.name = "OrderRuleError";
    this.code = code;
  }
}

type TransitionMap = Readonly<Partial<Record<OrderStatus, readonly OrderStatus[]>>>;

// Delivery and pickup share the start and the accept/cancel steps.
// They split after preparation: delivery goes through quality check and out for delivery,
// pickup waits at the counter.
export const ORDER_TRANSITIONS: Readonly<Record<OrderMode, TransitionMap>> = {
  delivery: {
    received: ["accepted", "rejected", "cancelled"],
    accepted: ["being_prepared", "cancelled"],
    being_prepared: ["quality_check"],
    quality_check: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
  },
  pickup: {
    received: ["accepted", "rejected", "cancelled"],
    accepted: ["being_prepared", "cancelled"],
    being_prepared: ["ready_for_pickup"],
    ready_for_pickup: ["picked_up"],
  },
};

const TERMINAL: readonly OrderStatus[] = ["delivered", "picked_up", "rejected", "cancelled"];
const COMPLETED: readonly OrderStatus[] = ["delivered", "picked_up"];
const CANCELLABLE: readonly OrderStatus[] = ["received", "accepted"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOrderMode(value: unknown): value is OrderMode {
  return typeof value === "string" && (ORDER_MODES as readonly string[]).includes(value);
}

export function nextStatuses(mode: OrderMode, status: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[mode][status] ?? [];
}

export function canTransition(mode: OrderMode, from: OrderStatus, to: OrderStatus): boolean {
  return nextStatuses(mode, from).includes(to);
}

export function assertTransition(mode: OrderMode, from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(mode, from, to)) {
    throw new OrderRuleError(
      "INVALID_ORDER_TRANSITION",
      `A ${mode} order cannot move from ${from} to ${to}.`,
    );
  }
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL.includes(status);
}

// Delivered or picked up. Reviews unlock only for these.
export function isCompleted(status: OrderStatus): boolean {
  return COMPLETED.includes(status);
}

// Customers can cancel until preparation starts.
export function isCancellable(status: OrderStatus): boolean {
  return CANCELLABLE.includes(status);
}

export type CancellationQuote = {
  refundPaise: number;
  retainedPaise: number;
};

// Before acceptance: full refund. After acceptance: the packaging fee is kept.
// Pickup orders carry no packaging fee, so they are refunded in full.
// A rejection is quoted as a cancellation from "received", so it is also a full refund.
export function cancellationQuote(
  from: OrderStatus,
  totalPaise: number,
  packagingFeePaise: number,
): CancellationQuote {
  if (!isCancellable(from)) {
    throw new OrderRuleError("ORDER_NOT_CANCELLABLE", `An order in ${from} cannot be cancelled.`);
  }
  assertWholePaise("totalPaise", totalPaise);
  assertWholePaise("packagingFeePaise", packagingFeePaise);
  if (packagingFeePaise > totalPaise) {
    throw new RangeError("packagingFeePaise cannot be more than totalPaise.");
  }
  const retainedPaise = from === "accepted" ? packagingFeePaise : 0;
  return { refundPaise: totalPaise - retainedPaise, retainedPaise };
}

function assertWholePaise(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative whole number of paise.`);
  }
}
