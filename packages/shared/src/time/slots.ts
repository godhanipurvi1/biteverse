import { assertWholeMinutes, formatClock, parseWindow } from "./hours.js";
import type { WeeklyHours } from "./hours.js";
import { kolkataMidnightUtc, weekdayOfDateKey } from "./kolkata.js";
import { latestSlotStart } from "./cutoff.js";

export interface Slot {
  label: string; // local start time, "HH:MM"
  startMinutes: number; // minutes from the opening day's midnight; can pass 1440
  startsAt: Date;
  endsAt: Date;
}

export interface SlotOptions {
  cutoffMinutes?: number; // default 0
  now?: Date; // slots that start before this instant are left out
}

// Slots for one Kolkata calendar date ("YYYY-MM-DD") on a weekly schedule.
export function generateSlots(
  hours: WeeklyHours,
  dateKey: string,
  slotMinutes: number,
  options: SlotOptions = {},
): Slot[] {
  const cutoffMinutes = options.cutoffMinutes ?? 0;
  assertWholeMinutes(slotMinutes, "slot length", 1);
  assertWholeMinutes(cutoffMinutes, "closing cutoff", 0);

  const day = hours[weekdayOfDateKey(dateKey)];
  if (day === null) {
    return [];
  }

  const { open } = parseWindow(day);
  const latest = latestSlotStart(day, slotMinutes, cutoffMinutes);
  const midnight = kolkataMidnightUtc(dateKey).getTime();

  const slots: Slot[] = [];
  for (let start = open; start <= latest; start += slotMinutes) {
    const startsAt = new Date(midnight + start * 60_000);
    if (options.now !== undefined && startsAt.getTime() < options.now.getTime()) {
      continue;
    }
    slots.push({
      label: formatClock(start),
      startMinutes: start,
      startsAt,
      endsAt: new Date(startsAt.getTime() + slotMinutes * 60_000),
    });
  }
  return slots;
}
