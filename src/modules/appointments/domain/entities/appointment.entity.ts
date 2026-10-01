import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';

export class AppointmentEntity {
  constructor(
    public readonly id: string,
    public readonly bookingCode: string,
    public readonly patientId: string,
    public readonly doctorClinicId: string,
    public readonly scheduleId: string,
    public readonly appointmentDate: Date,
    public readonly timeSlot: string,
    public readonly queueNumber: number,
    public readonly estimatedEntryTime: string,
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
  ) {}

  cancel(reason: string, cancelledBy: string): void {
    if (this.status === AppointmentStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed appointment.');
    }
    this.status = AppointmentStatus.CANCELLED;
    this.cancellationReason = reason;
    this.cancelledBy = cancelledBy;
  }

  complete(): void {
    if (
      this.status !== AppointmentStatus.CONFIRMED &&
      this.status !== AppointmentStatus.IN_PROGRESS &&
      this.status !== AppointmentStatus.CHECKED_IN
    ) {
      throw new Error('Appointment must be confirmed or checked in to be completed.');
    }
    this.status = AppointmentStatus.COMPLETED;
  }
}
