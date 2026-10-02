import { AppointmentStatus } from '../enums/appointment-status.enum';

/**
 * The appointment life-cycle as an explicit state machine.
 * This table is the single source of truth for "which status changes are legal".
 *
 *   PENDING ──► CONFIRMED ──► CHECKED_IN ──► IN_PROGRESS ──► COMPLETED
 *      │            │  │            │
 *      │            │  └► NO_SHOW   │
 *      └────────────┴───────────────┴──► CANCELLED
 *
 * COMPLETED, CANCELLED and NO_SHOW are terminal: nothing leaves them
 * (so a cancelled appointment can never be "un-cancelled").
 */
export const ALLOWED_STATUS_TRANSITIONS: Readonly<Record<AppointmentStatus, readonly AppointmentStatus[]>> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CHECKED_IN]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[status].length === 0;
}

/** Statuses in which the visit has not started yet, i.e. details/time may still be changed. */
export const PRE_VISIT_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];
