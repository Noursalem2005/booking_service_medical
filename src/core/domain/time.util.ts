/**
 * Time helpers shared by the booking contexts.
 * NOTE: the whole service treats clinic times as UTC (see SlotGeneratorService),
 * so these helpers are UTC-based on purpose.
 */
export const TIME_SLOT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeSlot(value: string): boolean {
  return TIME_SLOT_REGEX.test(value);
}

export function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** "HH:mm" (UTC) of a date. */
export function toTimeSlot(date: Date): string {
  return date.toISOString().substring(11, 16);
}

/** Combines a day and an "HH:mm" slot into the slot's start instant (UTC). */
export function combineDateAndTimeSlot(date: Date, timeSlot: string): Date {
  const day = startOfUtcDay(date).toISOString().substring(0, 10);
  return new Date(`${day}T${timeSlot}:00.000Z`);
}

export function isSameUtcDay(a: Date, b: Date): boolean {
  return startOfUtcDay(a).getTime() === startOfUtcDay(b).getTime();
}
