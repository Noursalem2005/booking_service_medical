import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';
import { combineDateAndTimeSlot } from '../../../../core/domain/time.util';
import {
  AppointmentNotModifiableException,
  InvalidAppointmentDetailsException,
  InvalidStatusTransitionException,
} from '../exceptions/appointment.exceptions';
import { AppointmentSlotPolicy } from '../policies/appointment-slot.policy';
import { PRE_VISIT_STATUSES, canTransition } from '../policies/appointment-status.policy';

export interface AppointmentDetailsUpdate {
  reasonForVisit?: string;
  notes?: string;
}

/**
 * Aggregate root. Every state change goes through a method here so the invariants
 * (legal status transitions, no past slots, no edits after cancellation, ...)
 * cannot be bypassed by a use case or a repository.
 */
export class AppointmentEntity {
  constructor(
    public readonly id: string,
    public readonly bookingCode: string,
    public readonly patientId: string,
    public readonly doctorClinicId: string,
    public readonly scheduleId: string,
    public appointmentDate: Date,
    public timeSlot: string,
    public queueNumber: number,
    public estimatedEntryTime: string,
    public readonly durationMinutes: number,
    public status: AppointmentStatus,
    public type: AppointmentType,
    public reasonForVisit?: string,
    public notes?: string,
    public cancellationReason?: string,
    public cancelledBy?: string,
    public fee: number = 0,
    public isPaid: boolean = false,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public deletedAt?: Date,
    public deletedBy?: string,
  ) {}

  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  /** The instant the slot starts (UTC). */
  get slotStart(): Date {
    return combineDateAndTimeSlot(this.appointmentDate, this.timeSlot);
  }

  /** Generic lifecycle move (check-in, start, complete, no-show...). Cancelling has its own method. */
  changeStatus(next: AppointmentStatus): void {
    this.assertNotDeleted();

    if (next === AppointmentStatus.CANCELLED) {
      throw new InvalidAppointmentDetailsException('Use the cancel operation (with a reason) to cancel an appointment.');
    }
    this.transitionTo(next);
  }

  cancel(reason: string, cancelledBy: string): void {
    this.assertNotDeleted();

    if (!reason?.trim()) {
      throw new InvalidAppointmentDetailsException('A cancellation reason is required.');
    }
    if (!cancelledBy?.trim()) {
      throw new InvalidAppointmentDetailsException('Cancelled-by is required.');
    }

    this.transitionTo(AppointmentStatus.CANCELLED);
    this.cancellationReason = reason.trim();
    this.cancelledBy = cancelledBy.trim();
  }

  complete(): void {
    this.changeStatus(AppointmentStatus.COMPLETED);
  }

  /**
   * Moves the appointment to another slot. Only allowed before the visit starts.
   * The caller supplies the queue number because computing it needs the repository.
   */
  reschedule(newDate: Date, newTimeSlot: string, newQueueNumber: number, now: Date): void {
    this.assertNotDeleted();

    if (!PRE_VISIT_STATUSES.includes(this.status)) {
      throw new AppointmentNotModifiableException(
        `An appointment in status ${this.status} cannot be rescheduled.`,
      );
    }
    AppointmentSlotPolicy.assertBookable(newDate, newTimeSlot, now);

    this.appointmentDate = newDate;
    this.timeSlot = newTimeSlot;
    this.estimatedEntryTime = newTimeSlot;
    this.queueNumber = newQueueNumber;
  }

  /**
   * Updates the free-text fields.
   *  - visit notes can be edited until the appointment is cancelled / marked no-show
   *    (doctors add them during and after the visit);
   *  - the reason for visit can only be changed before the visit has started.
   */
  updateDetails(update: AppointmentDetailsUpdate): void {
    this.assertNotDeleted();

    if (update.reasonForVisit === undefined && update.notes === undefined) {
      throw new InvalidAppointmentDetailsException('Provide at least one field to update (reasonForVisit or notes).');
    }
    if (this.status === AppointmentStatus.CANCELLED || this.status === AppointmentStatus.NO_SHOW) {
      throw new AppointmentNotModifiableException(`An appointment in status ${this.status} cannot be edited.`);
    }
    const visitStarted =
      this.status === AppointmentStatus.IN_PROGRESS || this.status === AppointmentStatus.COMPLETED;
    if (update.reasonForVisit !== undefined && visitStarted) {
      throw new AppointmentNotModifiableException(
        'The reason for visit can no longer be changed once the visit is in progress or completed.',
      );
    }

    if (update.reasonForVisit !== undefined) this.reasonForVisit = update.reasonForVisit.trim();
    if (update.notes !== undefined) this.notes = update.notes.trim();
  }

  /**
   * Soft delete: the record is kept (medical/audit trail) but hidden from every query.
   * Active appointments are cancelled first so the slot is released.
   * Visits that are in progress or completed are clinical records and cannot be deleted.
   */
  softDelete(deletedBy: string, now: Date, reason?: string): void {
    this.assertNotDeleted();

    if (!deletedBy?.trim()) {
      throw new InvalidAppointmentDetailsException('Deleted-by is required.');
    }
    if (this.status === AppointmentStatus.IN_PROGRESS || this.status === AppointmentStatus.COMPLETED) {
      throw new AppointmentNotModifiableException(
        `An appointment in status ${this.status} is part of the clinical record and cannot be deleted.`,
      );
    }

    if (canTransition(this.status, AppointmentStatus.CANCELLED)) {
      this.cancel(reason?.trim() || 'Deleted', deletedBy);
    }
    this.deletedAt = now;
    this.deletedBy = deletedBy.trim();
  }

  private transitionTo(next: AppointmentStatus): void {
    if (!canTransition(this.status, next)) {
      throw new InvalidStatusTransitionException(this.status, next);
    }
    this.status = next;
  }

  private assertNotDeleted(): void {
    if (this.isDeleted) {
      throw new AppointmentNotModifiableException('This appointment has been deleted.');
    }
  }
}
