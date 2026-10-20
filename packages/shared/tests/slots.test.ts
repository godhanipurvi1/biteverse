import { describe, expect, it } from "vitest";
import {
  closingMinutes,
  formatClock,
  generateSlots,
  isBranchOpen,
  kolkataMidnightUtc,
  kolkataParts,
  latestSlotStart,
  parseClock,
  weekdayOfDateKey,
} from "../src/index.js";
import type { DayWindow, Weekday, WeeklyHours } from "../src/index.js";

function week(day: DayWindow | null, overrides: Partial<Record<Weekday, DayWindow | null>> = {}): WeeklyHours {
  return { 0: day, 1: day, 2: day, 3: day, 4: day, 5: day, 6: day, ...overrides };
}

describe("Kolkata clock", () => {
  it("reads the Kolkata date, weekday and minutes", () => {
    expect(kolkataParts(new Date("2026-10-20T00:00:00Z"))).toEqual({ dateKey: "2026-10-20", weekday: 2, minutes: 330 });
  });

  it("rolls the date over at Kolkata midnight", () => {
    expect(kolkataParts(new Date("2026-10-19T19:00:00Z"))).toEqual({ dateKey: "2026-10-20", weekday: 2, minutes: 30 });
  });

  it("gives the weekday of a calendar date", () => {
    expect(weekdayOfDateKey("2026-10-20")).toBe(2);
  });

  it("gives Kolkata midnight as a UTC instant", () => {
    expect(kolkataMidnightUtc("2026-10-20").toISOString()).toBe("2026-10-19T18:30:00.000Z");
  });

  it("rejects dates that do not exist", () => {
    expect(() => weekdayOfDateKey("2026-02-30")).toThrow(RangeError);
    expect(() => weekdayOfDateKey("20-10-2026")).toThrow(RangeError);
  });
});

describe("clock values", () => {
  it("parses and formats HH:MM", () => {
    expect(parseClock("09:05")).toBe(545);
    expect(formatClock(1530)).toBe("01:30");
    expect(() => parseClock("24:00")).toThrow(RangeError);
  });
});

describe("isBranchOpen", () => {
  it("includes the opening minute and excludes the closing minute", () => {
    const hours = week({ open: "10:00", close: "22:00" });
    expect(isBranchOpen(hours, new Date("2026-10-20T04:30:00Z"))).toBe(true); // 10:00
    expect(isBranchOpen(hours, new Date("2026-10-20T04:29:00Z"))).toBe(false); // 09:59
    expect(isBranchOpen(hours, new Date("2026-10-20T16:29:00Z"))).toBe(true); // 21:59
    expect(isBranchOpen(hours, new Date("2026-10-20T16:30:00Z"))).toBe(false); // 22:00
  });

  it("covers both sides of midnight for an overnight window", () => {
    const hours = week({ open: "18:00", close: "02:00" });
    expect(isBranchOpen(hours, new Date("2026-10-20T13:30:00Z"))).toBe(true); // 19:00
    expect(isBranchOpen(hours, new Date("2026-10-20T20:00:00Z"))).toBe(true); // 01:30 next day
    expect(isBranchOpen(hours, new Date("2026-10-20T20:30:00Z"))).toBe(false); // 02:00 next day
    expect(isBranchOpen(hours, new Date("2026-10-20T06:30:00Z"))).toBe(false); // 12:00
  });

  it("stays closed on a closed day", () => {
    expect(isBranchOpen(week(null), new Date("2026-10-20T04:30:00Z"))).toBe(false);
  });

  it("rejects a window whose open and close are the same", () => {
    expect(() => isBranchOpen(week({ open: "10:00", close: "10:00" }), new Date())).toThrow(RangeError);
  });
});

describe("slots", () => {
  it("generates same-day slots that respect the closing cutoff", () => {
    const slots = generateSlots(week({ open: "10:00", close: "22:00" }), "2026-10-20", 30, { cutoffMinutes: 60 });
    expect(slots.length).toBe(23);
    expect(slots[0]?.label).toBe("10:00");
    expect(slots[slots.length - 1]?.label).toBe("21:00");
  });

  it("generates slots across midnight for an overnight window", () => {
    const slots = generateSlots(week({ open: "18:00", close: "02:00" }), "2026-10-20", 30);
    expect(slots.length).toBe(16);
    expect(slots[slots.length - 1]?.label).toBe("01:30");
    expect(slots[slots.length - 1]?.startsAt.toISOString()).toBe("2026-10-20T20:00:00.000Z");
  });

  it("leaves out slots that have already started", () => {
    const slots = generateSlots(week({ open: "10:00", close: "22:00" }), "2026-10-20", 30, {
      now: new Date("2026-10-20T06:45:00Z"), // 12:15
    });
    expect(slots[0]?.label).toBe("12:30");
    expect(slots.length).toBe(19);
  });

  it("returns no slots on a closed day or when the window is shorter than a slot", () => {
    expect(generateSlots(week(null), "2026-10-20", 30)).toEqual([]);
    expect(generateSlots(week({ open: "10:00", close: "10:15" }), "2026-10-20", 30)).toEqual([]);
  });

  it("works out the closing time and latest start", () => {
    expect(closingMinutes({ open: "18:00", close: "02:00" })).toBe(1560);
    expect(latestSlotStart({ open: "10:00", close: "22:00" }, 30, 60)).toBe(1260);
  });
});
