export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Opening window for one day: "HH:MM", 24-hour, Asia/Kolkata.
// A close time earlier than the open time means the branch closes after midnight.
export interface DayWindow {
  open: string;
  close: string;
}

// Keys are weekdays (0 = Sunday ... 6 = Saturday). null means closed all day.
export type WeeklyHours = Readonly<Record<Weekday, DayWindow | null>>;

export interface ParsedWindow {
  open: number; // minutes from local midnight, 0 to 1439
  close: number; // minutes from local midnight, 0 to 1439
  overnight: boolean;
}

export const PREVIOUS_WEEKDAY: Readonly<Record<Weekday, Weekday>> = {
  0: 6,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
};

const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseClock(value: string): number {
  const match = CLOCK_PATTERN.exec(value);
  if (match === null) {
    throw new RangeError(`time must be HH:MM in 24-hour format, got ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

// Wraps any number of minutes into 0 to 1439 and formats it as HH:MM.
export function formatClock(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function parseWindow(day: DayWindow): ParsedWindow {
  const open = parseClock(day.open);
  const close = parseClock(day.close);
  if (open === close) {
    throw new RangeError("opening and closing times cannot be the same");
  }
  return { open, close, overnight: close < open };
}

export function assertWholeMinutes(value: number, name: string, min: number): void {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${name} must be a whole number of at least ${min}, got ${String(value)}`);
  }
}
