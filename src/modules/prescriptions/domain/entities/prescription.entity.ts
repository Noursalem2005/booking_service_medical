import { PrescriptionStatus } from '../enums/prescription-status.enum';
import {
  InvalidPrescriptionException,
  PrescriptionNotModifiableException,
} from '../exceptions/prescription.exceptions';
import { PrescriptionItem, PrescriptionItemProps } from '../value-objects/prescription-item.vo';

export const MAX_ITEMS_PER_PRESCRIPTION = 20;
export const DEFAULT_VALIDITY_DAYS = 30;
export const MAX_VALIDITY_DAYS = 365;

export interface IssuePrescriptionProps {
  id: string;
  prescriptionCode: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorClinicId: string;
  items: PrescriptionItemProps[];
  diagnosis?: string;
  notes?: string;
  validityDays?: number;
  issuedAt: Date;
}

/**
 * Aggregate root.
 * A prescription is a legal/clinical document: once issued its content is immutable –
 * the only allowed change is cancelling it (e.g. issued by mistake).
 */
export class PrescriptionEntity {
  constructor(
    public readonly id: string,
    public readonly prescriptionCode: string,
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly doctorClinicId: string,
    public readonly items: readonly PrescriptionItem[],
    public readonly issuedAt: Date,
    public readonly validUntil: Date,
    public status: PrescriptionStatus = PrescriptionStatus.ACTIVE,
    public readonly diagnosis?: string,
    public readonly notes?: string,
    public cancellationReason?: string,
    public cancelledBy?: string,
    public cancelledAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /** Factory that enforces every invariant of a new prescription. */
  static issue(props: IssuePrescriptionProps): PrescriptionEntity {
    if (!props.doctorId?.trim()) {
      throw new InvalidPrescriptionException('A prescription must be issued by a doctor.');
    }
    if (!props.items?.length) {
      throw new InvalidPrescriptionException('A prescription needs at least one medication.');
    }
    if (props.items.length > MAX_ITEMS_PER_PRESCRIPTION) {
      throw new InvalidPrescriptionException(`A prescription can contain at most ${MAX_ITEMS_PER_PRESCRIPTION} medications.`);
    }

    const validityDays = props.validityDays ?? DEFAULT_VALIDITY_DAYS;
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > MAX_VALIDITY_DAYS) {
      throw new InvalidPrescriptionException(`Validity must be a whole number of days between 1 and ${MAX_VALIDITY_DAYS}.`);
    }

    const validUntil = new Date(props.issuedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);

    return new PrescriptionEntity(
      props.id,
      props.prescriptionCode,
      props.appointmentId,
      props.patientId,
      props.doctorId.trim(),
      props.doctorClinicId,
      props.items.map((item) => PrescriptionItem.create(item)),
      props.issuedAt,
      validUntil,
      PrescriptionStatus.ACTIVE,
      props.diagnosis?.trim() || undefined,
      props.notes?.trim() || undefined,
    );
  }

  /** Expiry is derived from the clock, never stored, so it can't go stale. */
  isExpired(now: Date): boolean {
    return now.getTime() > this.validUntil.getTime();
  }

  cancel(reason: string, cancelledBy: string, now: Date): void {
    if (this.status === PrescriptionStatus.CANCELLED) {
      throw new PrescriptionNotModifiableException('This prescription is already cancelled.');
    }
    if (!reason?.trim()) {
      throw new InvalidPrescriptionException('A cancellation reason is required.');
    }
    if (!cancelledBy?.trim()) {
      throw new InvalidPrescriptionException('Cancelled-by is required.');
    }

    this.status = PrescriptionStatus.CANCELLED;
    this.cancellationReason = reason.trim();
    this.cancelledBy = cancelledBy.trim();
    this.cancelledAt = now;
  }
}
