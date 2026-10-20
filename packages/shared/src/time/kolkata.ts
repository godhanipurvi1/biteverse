import type { Weekday } from "./hours.js";

// Asia/Kolkata is UTC+05:30 all year, with no daylight saving, so a fixed offset is exact.
export const KOLKATA_OFFSET_MINUTES = 330;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface KolkataParts {
  dateKey: string; // "YYYY-MM-DD"
  weekday: Weekday;
  minutes: number; // minutes since local midnight, 0 to 1439
}

function toKolkataClock(instant: Date): Date {
  return new Date(instant.getTime() + KOLKATA_OFFSET_MINUTES * 60_000);
}

export function kolkataParts(instant: Date): KolkataParts {
  const local = toKolkataClock(instant);
  return {
    dateKey: local.toISOString().slice(0, 10),
    weekday: local.getUTCDay() as Weekday,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

// UTC midnight of a calendar date, as milliseconds. Rejects dates that do not exist.
function dateKeyToUtcMillis(dateKey: string): number {
  const millis = DATE_KEY_PATTERN.test(dateKey) ? Date.parse(`${dateKey}T00:00:00Z`) : Number.NaN;
  if (Number.isNaN(millis) || new Date(millis).toISOString().slice(0, 10) !== dateKey) {
    throw new RangeError(`date must be a real YYYY-MM-DD date, got ${dateKey}`);
  }
  return millis;
}

export function weekdayOfDateKey(dateKey: string): Weekday {
  return new Date(dateKeyToUtcMillis(dateKey)).getUTCDay() as Weekday;
}

// The instant at which the Kolkata calendar day with this date key begins.
export function kolkataMidnightUtc(dateKey: string): Date {
  return new Date(dateKeyToUtcMillis(dateKey) - KOLKATA_OFFSET_MINUTES * 60_000);
}
