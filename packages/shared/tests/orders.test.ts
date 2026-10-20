import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  OrderRuleError,
  assertTransition,
  canTransition,
  cancellationQuote,
  isCancellable,
  isCompleted,
  isOrderStatus,
  isTerminal,
  nextStatuses,
  type OrderMode,
  type OrderStatus,
} from "../src/orders/order-status";

function errorOf(fn: () => void): unknown {
  try {
    fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected the call to throw");
}

function allowedPath(mode: OrderMode, path: readonly OrderStatus[]): boolean {
  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1];
    const to = path[i];
    if (from === undefined || to === undefined || !canTransition(mode, from, to)) {
      return false;
    }
  }
  return true;
}

describe("order statuses", () => {
  it("lists ten statuses and recognises only those", () => {
    expect(ORDER_STATUSES.length).toBe(10);
    expect(isOrderStatus("being_prepared")).toBe(true);
    expect(isOrderStatus("preparing")).toBe(false);
    expect(isOrderStatus(3)).toBe(false);
  });
});

describe("transitions", () => {
  it("walks a delivery order from received to delivered", () => {
    expect(
      allowedPath("delivery", [
        "received",
        "accepted",
        "being_prepared",
        "quality_check",
        "out_for_delivery",
        "delivered",
      ]),
    ).toBe(true);
  });

  it("walks a pickup order from received to picked up", () => {
    expect(
      allowedPath("pickup", ["received", "accepted", "being_prepared", "ready_for_pickup", "picked_up"]),
    ).toBe(true);
  });

  it("keeps the two modes apart after preparation", () => {
    expect(canTransition("delivery", "being_prepared", "ready_for_pickup")).toBe(false);
    expect(canTransition("pickup", "ready_for_pickup", "out_for_delivery")).toBe(false);
  });

  it("does not allow skipping steps", () => {
    expect(canTransition("delivery", "received", "being_prepared")).toBe(false);
    expect(canTransition("pickup", "accepted", "picked_up")).toBe(false);
  });

  it("lets the branch reject or the customer cancel a received order", () => {
    expect(canTransition("delivery", "received", "rejected")).toBe(true);
    expect(canTransition("pickup", "received", "cancelled")).toBe(true);
  });

  it("blocks cancellation once preparation has started", () => {
    expect(canTransition("delivery", "being_prepared", "cancelled")).toBe(false);
    expect(canTransition("pickup", "ready_for_pickup", "cancelled")).toBe(false);
  });

  it("gives terminal statuses no next step in either mode", () => {
    const terminal: OrderStatus[] = ["delivered", "picked_up", "rejected", "cancelled"];
    for (const status of terminal) {
      expect(nextStatuses("delivery", status).length).toBe(0);
      expect(nextStatuses("pickup", status).length).toBe(0);
    }
  });

  it("throws an OrderRuleError with a code for an illegal move", () => {
    const err = errorOf(() => assertTransition("pickup", "picked_up", "accepted"));
    expect(err instanceof OrderRuleError).toBe(true);
    expect((err as OrderRuleError).code).toBe("INVALID_ORDER_TRANSITION");
  });
});

describe("status groups", () => {
  it("marks delivered, picked up, rejected and cancelled as terminal", () => {
    expect(isTerminal("delivered")).toBe(true);
    expect(isTerminal("picked_up")).toBe(true);
    expect(isTerminal("rejected")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("accepted")).toBe(false);
  });

  it("counts only delivered and picked up as completed", () => {
    expect(isCompleted("delivered")).toBe(true);
    expect(isCompleted("picked_up")).toBe(true);
    expect(isCompleted("cancelled")).toBe(false);
  });

  it("allows cancellation only before preparation", () => {
    expect(isCancellable("received")).toBe(true);
    expect(isCancellable("accepted")).toBe(true);
    expect(isCancellable("being_prepared")).toBe(false);
    expect(isCancellable("cancelled")).toBe(false);
  });
});

describe("cancellation refunds", () => {
  it("refunds the full amount before acceptance", () => {
    expect(cancellationQuote("received", 52000, 1000)).toEqual({ refundPaise: 52000, retainedPaise: 0 });
  });

  it("keeps the packaging fee after acceptance", () => {
    expect(cancellationQuote("accepted", 52000, 1000)).toEqual({ refundPaise: 51000, retainedPaise: 1000 });
  });

  it("refunds a pickup order in full after acceptance, since it has no packaging fee", () => {
    expect(cancellationQuote("accepted", 30000, 0)).toEqual({ refundPaise: 30000, retainedPaise: 0 });
  });

  it("refunds a rejected order in full", () => {
    expect(cancellationQuote("received", 40000, 1000).refundPaise).toBe(40000);
  });

  it("refuses once preparation has begun", () => {
    const err = errorOf(() => cancellationQuote("being_prepared", 52000, 1000));
    expect((err as OrderRuleError).code).toBe("ORDER_NOT_CANCELLABLE");
  });

  it("rejects amounts that are not whole, non-negative paise", () => {
    expect(() => cancellationQuote("received", -1, 0)).toThrow(RangeError);
    expect(() => cancellationQuote("received", 100.5, 0)).toThrow(RangeError);
  });

  it("rejects a packaging fee larger than the total", () => {
    expect(() => cancellationQuote("accepted", 500, 1000)).toThrow(RangeError);
  });
});
