import {
  DomainConflictException,
  DomainNotFoundException,
  DomainValidationException,
} from '../../../../core/domain/exceptions/domain.exception';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class AppointmentNotFoundException extends DomainNotFoundException {
  constructor(id: string) {
    super(`Appointment '${id}' was not found.`, 'APPOINTMENT_NOT_FOUND');
  }
}

export class InvalidAppointmentSlotException extends DomainValidationException {
  constructor(message: string) {
    super(message, 'INVALID_APPOINTMENT_SLOT');
  }
}

export class InvalidAppointmentDetailsException extends DomainValidationException {
  constructor(message: string) {
    super(message, 'INVALID_APPOINTMENT_DETAILS');
  }
}

export class SlotAlreadyBookedException extends DomainConflictException {
  constructor() {
    super('The selected time slot is already booked.', 'SLOT_ALREADY_BOOKED');
  }
}

export class InvalidStatusTransitionException extends DomainConflictException {
  constructor(
    public readonly from: AppointmentStatus,
    public readonly to: AppointmentStatus,
  ) {
    super(`Invalid status change: an appointment cannot move from ${from} to ${to}.`, 'INVALID_STATUS_TRANSITION');
  }
}

export class AppointmentNotModifiableException extends DomainConflictException {
  constructor(message: string) {
    super(message, 'APPOINTMENT_NOT_MODIFIABLE');
  }
}
