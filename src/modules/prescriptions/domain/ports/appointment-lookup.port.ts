/**
 * Anti-corruption layer between Prescriptions and Appointments.
 *
 * Prescriptions only needs a tiny read-model of an appointment, expressed in ITS own
 * language – not the Appointments aggregate. Today an adapter reads it in-process; if the
 * contexts are split into separate microservices, only the adapter changes (HTTP/gRPC call).
 */
export interface AppointmentSnapshot {
  id: string;
  patientId: string;
  doctorClinicId: string;
  /** True once the patient has been checked in (visit started or finished). */
  patientAttended: boolean;
}

export interface AppointmentLookupPort {
  findById(appointmentId: string): Promise<AppointmentSnapshot | null>;
}

export const APPOINTMENT_LOOKUP = Symbol('AppointmentLookupPort');
