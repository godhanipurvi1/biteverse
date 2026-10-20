import { describe, it, expect } from "vitest";
import {
  applyBundles,
  type Bundle,
  type BundleCartLine,
} from "../src/pricing/bundle-apply";

const NOW = new Date("2026-06-15T12:00:00Z");
const CTX = { branchId: "branch-1", now: NOW };

function bundle(overrides: Partial<Bundle>): Bundle {
  return {
    id: "bundle-1",
    name: "Pizza and drink",
    includes: [
      { itemId: "pizza", quantity: 1 },
      { itemId: "drink", quantity: 1 },
    ],
    bundlePricePaise: 42000,
    branchIds: [],
    validFrom: new Date("2026-01-01T00:00:00Z"),
    validTo: new Date("2026-12-31T23:59:59Z"),
    status: "active",
    ...overrides,
  };
}

function line(overrides: Partial<BundleCartLine>): BundleCartLine {
  return {
    lineId: "line-1",
    itemId: "pizza",
    categoryId: "pizza-cat",
    quantity: 1,
    unitPricePaise: 40000,
    ...overrides,
  };
}

const pizza = line({});
const drink = line({
  lineId: "line-2",
  itemId: "drink",
  categoryId: "drinks",
  unitPricePaise: 8000,
});

describe("bundle application", () => {
  it("applies a bundle when every included item is present", () => {
    const r = applyBundles([pizza, drink], [bundle({})], CTX);
    expect(r.applied).toEqual([{ bundleId: "bundle-1", times: 1, savingsPaise: 6000 }]);
    expect(r.regularSubtotalPaise).toBe(48000);
    expect(r.subtotalPaise).toBe(42000);
  });

  it("does not apply when an included item is missing", () => {
    const r = applyBundles([pizza], [bundle({})], CTX);
    expect(r.applied).toEqual([]);
    expect(r.subtotalPaise).toBe(40000);
  });

  it("applies once per full set and charges extra items at full price", () => {
    const r = applyBundles(
      [line({ quantity: 3 }), { ...drink, quantity: 2 }],
      [bundle({})],
      CTX,
    );
    expect(r.applied).toEqual([{ bundleId: "bundle-1", times: 2, savingsPaise: 12000 }]);
    expect(r.regularSubtotalPaise).toBe(136000);
    expect(r.subtotalPaise).toBe(124000);
  });

  it("fills a category slot from any matching item", () => {
    const pizzaA = line({ lineId: "line-a", itemId: "pizza-a", unitPricePaise: 40000 });
    const pizzaB = line({ lineId: "line-b", itemId: "pizza-b", unitPricePaise: 35000 });
    const r = applyBundles(
      [pizzaA, pizzaB],
      [
        bundle({
          id: "two-pizzas",
          includes: [{ categoryId: "pizza-cat", quantity: 2 }],
          bundlePricePaise: 60000,
        }),
      ],
      CTX,
    );
    expect(r.applied).toEqual([{ bundleId: "two-pizzas", times: 1, savingsPaise: 15000 }]);
    expect(r.subtotalPaise).toBe(60000);
  });

  it("skips a bundle that would cost more than its items", () => {
    const r = applyBundles([pizza, drink], [bundle({ bundlePricePaise: 50000 })], CTX);
    expect(r.applied).toEqual([]);
    expect(r.subtotalPaise).toBe(48000);
  });

  it("skips inactive, expired, and other-branch bundles", () => {
    const bundles = [
      bundle({ id: "inactive", status: "inactive" }),
      bundle({ id: "expired", validTo: new Date("2026-06-01T00:00:00Z") }),
      bundle({ id: "other-branch", branchIds: ["branch-9"] }),
    ];
    const r = applyBundles([pizza, drink], bundles, CTX);
    expect(r.applied).toEqual([]);
    expect(r.subtotalPaise).toBe(48000);
  });

  it("uses each cart unit in only one bundle", () => {
    const pizzaOnly = bundle({
      id: "pizza-only",
      includes: [{ itemId: "pizza", quantity: 1 }],
      bundlePricePaise: 30000,
    });
    const r = applyBundles([pizza, drink], [bundle({ id: "full" }), pizzaOnly], CTX);
    expect(r.applied.map((a) => a.bundleId)).toEqual(["full"]);
  });

  it("rejects non-integer bundle prices", () => {
    expect(() =>
      applyBundles([pizza, drink], [bundle({ bundlePricePaise: 419.5 })], CTX),
    ).toThrow(RangeError);
  });

  it("rejects an include that names neither an item nor a category", () => {
    expect(() =>
      applyBundles([pizza], [bundle({ includes: [{ quantity: 1 }] })], CTX),
    ).toThrow();
  });
});
