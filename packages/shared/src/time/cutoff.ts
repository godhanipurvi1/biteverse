import { assertWholeMinutes, parseWindow } from "./hours.js";
import type { DayWindow } from "./hours.js";

// Closing time in minutes from the opening day's midnight. A closing time after
// midnight goes past 1440 (02:00 the next day is 1560).
export function closingMinutes(day: DayWindow): number {
  const w = parseWindow(day);
  return w.overnight ? w.close + 1440 : w.close;
}

// Latest start, in minutes from the opening day's midnight, for a slot that starts
// at least cutoffMinutes before closing and ends by closing.
export function latestSlotStart(day: DayWindow, slotMinutes: number, cutoffMinutes: number): number {
  assertWholeMinutes(slotMinutes, "slot length", 1);
  assertWholeMinutes(cutoffMinutes, "closing cutoff", 0);
  const closing = closingMinutes(day);
  return Math.min(closing - cutoffMinutes, closing - slotMinutes);
}
