import { PREVIOUS_WEEKDAY, parseWindow } from "./hours.js";
import type { WeeklyHours } from "./hours.js";
import { kolkataParts } from "./kolkata.js";

// True if the branch is open at this instant. A window includes its opening minute
// and excludes its closing minute.
export function isBranchOpen(hours: WeeklyHours, instant: Date): boolean {
  const { weekday, minutes } = kolkataParts(instant);

  const today = hours[weekday];
  if (today) {
    const w = parseWindow(today);
    const inside = w.overnight ? minutes >= w.open : minutes >= w.open && minutes < w.close;
    if (inside) {
      return true;
    }
  }

  // An overnight window from yesterday still covers the early hours of today.
  const yesterday = hours[PREVIOUS_WEEKDAY[weekday]];
  if (yesterday) {
    const w = parseWindow(yesterday);
    if (w.overnight && minutes < w.close) {
      return true;
    }
  }

  return false;
}
