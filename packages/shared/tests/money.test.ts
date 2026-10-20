import { describe, expect, it } from "vitest";
import {
  assertPaise,
  formatINR,
  gstOn,
  isPaise,
  paiseToRupees,
  percentOf,
  rupeesToPaise,
} from "../src/index.js";

const R = "\u20B9";

describe("paise helpers", () => {
  it("converts rupees to paise without float drift", () => {
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
    expect(rupeesToPaise(199.99)).toBe(19999);
    expect(paiseToRupees(19999)).toBe(199.99);
  });

  it("accepts only integers", () => {
    expect(isPaise(100)).toBe(true);
    expect(isPaise(10.5)).toBe(false);
    expect(isPaise("100")).toBe(false);
    expect(isPaise(Number.NaN)).toBe(false);
    expect(() => assertPaise(10.5)).toThrow(RangeError);
  });

  it("rounds percentages half up", () => {
    expect(percentOf(10000, 500)).toBe(500);
    expect(percentOf(1, 5000)).toBe(1); // 0.5 rounds up
    expect(percentOf(3, 5000)).toBe(2); // 1.5 rounds up
    expect(percentOf(0, 500)).toBe(0);
    expect(() => percentOf(-1, 500)).toThrow(RangeError);
    expect(() => percentOf(100, 1.5)).toThrow(RangeError);
  });

  it("calculates 5% GST", () => {
    expect(gstOn(36000)).toBe(1800);
    expect(gstOn(33)).toBe(2); // 1.65 -> 2
    expect(gstOn(-500)).toBe(0);
  });
});

describe("formatINR", () => {
  it("hides .00 for whole rupees", () => {
    expect(formatINR(4000)).toBe(`${R}40`);
    expect(formatINR(0)).toBe(`${R}0`);
  });

  it("shows paise when present", () => {
    expect(formatINR(4050)).toBe(`${R}40.50`);
    expect(formatINR(5)).toBe(`${R}0.05`);
  });

  it("can always show paise", () => {
    expect(formatINR(4000, { alwaysShowPaise: true })).toBe(`${R}40.00`);
  });

  it("uses Indian digit grouping", () => {
    expect(formatINR(99900)).toBe(`${R}999`);
    expect(formatINR(100000)).toBe(`${R}1,000`);
    expect(formatINR(12345600)).toBe(`${R}1,23,456`);
    expect(formatINR(1234567800)).toBe(`${R}1,23,45,678`);
  });

  it("handles negative amounts", () => {
    expect(formatINR(-4050)).toBe(`-${R}40.50`);
  });

  it("rejects non-integer paise", () => {
    expect(() => formatINR(10.5)).toThrow(RangeError);
  });
});
