import type { Paise } from "../money/paise.js";

export interface BundleInclude {
  itemId?: string;
  categoryId?: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  name: string;
  includes: readonly BundleInclude[];
  bundlePricePaise: Paise;
  branchIds: readonly string[]; // empty means every branch
  validFrom: Date;
  validTo: Date;
  status: "active" | "inactive";
}

export interface BundleCartLine {
  lineId: string;
  itemId: string;
  categoryId: string;
  quantity: number;
  unitPricePaise: Paise; // regular price per unit, options included
}

export interface BundleContext {
  branchId: string;
  now: Date;
}

export interface AppliedBundle {
  bundleId: string;
  times: number;
  savingsPaise: Paise;
}

export interface BundleResult {
  applied: AppliedBundle[];
  regularSubtotalPaise: Paise;
  bundleSavingsPaise: Paise;
  subtotalPaise: Paise; // after bundle pricing, before discounts
}

function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer`);
  }
}

function assertValidInclude(include: BundleInclude): void {
  const hasItem = include.itemId !== undefined;
  const hasCategory = include.categoryId !== undefined;
  if (hasItem === hasCategory) {
    throw new Error("A bundle include needs exactly one of itemId or categoryId");
  }
  if (!Number.isInteger(include.quantity) || include.quantity < 1) {
    throw new RangeError("A bundle include quantity must be a positive integer");
  }
}

export function isBundleLive(bundle: Bundle, ctx: BundleContext): boolean {
  if (bundle.status !== "active") return false;
  if (ctx.now < bundle.validFrom || ctx.now > bundle.validTo) return false;
  return bundle.branchIds.length === 0 || bundle.branchIds.includes(ctx.branchId);
}

function matches(include: BundleInclude, line: BundleCartLine): boolean {
  return include.itemId !== undefined
    ? line.itemId === include.itemId
    : line.categoryId === include.categoryId;
}

// Picks the cart units that would fill the bundle without changing `remaining`.
// Category slots take units in cart order. Returns null if the bundle cannot be filled.
function pickUnits(
  bundle: Bundle,
  lines: readonly BundleCartLine[],
  remaining: ReadonlyMap<string, number>,
): Map<string, number> | null {
  const take = new Map<string, number>();
  for (const include of bundle.includes) {
    assertValidInclude(include);
    let need = include.quantity;
    for (const line of lines) {
      if (need === 0) break;
      if (!matches(include, line)) continue;
      const free = (remaining.get(line.lineId) ?? 0) - (take.get(line.lineId) ?? 0);
      if (free <= 0) continue;
      const used = Math.min(free, need);
      take.set(line.lineId, (take.get(line.lineId) ?? 0) + used);
      need -= used;
    }
    if (need > 0) return null;
  }
  return take.size > 0 ? take : null;
}

export function applyBundles(
  lines: readonly BundleCartLine[],
  bundles: readonly Bundle[],
  ctx: BundleContext,
): BundleResult {
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new RangeError("Cart line quantity must be a positive integer");
    }
    assertNonNegativeInt(line.unitPricePaise, "unitPricePaise");
  }

  const unitPrice = new Map<string, Paise>(
    lines.map((line) => [line.lineId, line.unitPricePaise] as [string, Paise]),
  );
  const remaining = new Map<string, number>(
    lines.map((line) => [line.lineId, line.quantity] as [string, number]),
  );
  const regularSubtotalPaise = lines.reduce(
    (sum, line) => sum + line.unitPricePaise * line.quantity,
    0,
  );

  const applied: AppliedBundle[] = [];
  let bundleSavingsPaise = 0;

  for (const bundle of bundles) {
    if (!isBundleLive(bundle, ctx)) continue;
    assertNonNegativeInt(bundle.bundlePricePaise, "bundlePricePaise");

    let times = 0;
    let savings = 0;
    for (;;) {
      const take = pickUnits(bundle, lines, remaining);
      if (take === null) break;

      let regular = 0;
      for (const [lineId, qty] of take) {
        regular += (unitPrice.get(lineId) ?? 0) * qty;
      }
      const saving = regular - bundle.bundlePricePaise;
      if (saving <= 0) break; // never apply a bundle that does not save money

      for (const [lineId, qty] of take) {
        remaining.set(lineId, (remaining.get(lineId) ?? 0) - qty);
      }
      times += 1;
      savings += saving;
    }

    if (times > 0) {
      applied.push({ bundleId: bundle.id, times, savingsPaise: savings });
      bundleSavingsPaise += savings;
    }
  }

  return {
    applied,
    regularSubtotalPaise,
    bundleSavingsPaise,
    subtotalPaise: regularSubtotalPaise - bundleSavingsPaise,
  };
}
