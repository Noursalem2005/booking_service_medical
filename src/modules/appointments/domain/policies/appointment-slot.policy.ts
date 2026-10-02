import { combineDateAndTimeSlot, isValidTimeSlot } from '../../../../core/domain/time.util';
import { InvalidAppointmentSlotException } from '../exceptions/appointment.exceptions';

/** Business rules that decide whether a (date, time slot) pair can be booked at all. */
export class AppointmentSlotPolicy {
  static assertBookable(appointmentDate: Date, timeSlot: string, now: Date): void {
    if (Number.isNaN(appointmentDate.getTime())) {
      throw new InvalidAppointmentSlotException('Appointment date is not a valid date.');
    }
    if (!isValidTimeSlot(timeSlot)) {
      throw new InvalidAppointmentSlotException("Time slot must be in 'HH:mm' 24-hour format.");
    }

    const slotStart = combineDateAndTimeSlot(appointmentDate, timeSlot);
    if (slotStart.getTime() <= now.getTime()) {
      throw new InvalidAppointmentSlotException('Appointments cannot be booked in the past.');
    }
  }
}
