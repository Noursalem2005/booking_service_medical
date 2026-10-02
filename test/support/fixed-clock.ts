import type { Clock } from '../../src/core/application/clock.port';

export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current);
  }
  set(date: Date): void {
    this.current = date;
  }
}

/** The "current time" used across specs: Fri 2 Oct 2026, 09:00 UTC. */
export const NOW = new Date('2026-10-02T09:00:00.000Z');
