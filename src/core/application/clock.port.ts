/** Port for "what time is it" – lets use cases be tested deterministically. */
export interface Clock {
  now(): Date;
}

export const CLOCK = Symbol('Clock');
