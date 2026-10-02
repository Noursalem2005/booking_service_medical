import {
  DomainConflictException,
  DomainNotFoundException,
  DomainValidationException,
} from '../../../../core/domain/exceptions/domain.exception';

export class PrescriptionNotFoundException extends DomainNotFoundException {
  constructor(id: string) {
    super(`Prescription '${id}' was not found.`, 'PRESCRIPTION_NOT_FOUND');
  }
}

export class PrescriptionAppointmentNotFoundException extends DomainNotFoundException {
  constructor(appointmentId: string) {
    super(`Appointment '${appointmentId}' was not found.`, 'APPOINTMENT_NOT_FOUND');
  }
}

export class InvalidPrescriptionException extends DomainValidationException {
  constructor(message: string) {
    super(message, 'INVALID_PRESCRIPTION');
  }
}

/** A prescription can only follow a visit the patient actually attended. */
export class VisitNotAttendedException extends DomainConflictException {
  constructor(appointmentId: string) {
    super(
      `Appointment '${appointmentId}' has not been attended (patient must be checked in), so a prescription cannot be issued.`,
      'VISIT_NOT_ATTENDED',
    );
  }
}

export class PrescriptionNotModifiableException extends DomainConflictException {
  constructor(message: string) {
    super(message, 'PRESCRIPTION_NOT_MODIFIABLE');
  }
}
