import { AppointmentEntity } from '../entities/appointment.entity';

export interface IAppointmentRepository {
  create(appointment: Partial<AppointmentEntity>): Promise<AppointmentEntity>;
  findById(id: string): Promise<AppointmentEntity | null>;
  findByPatientId(patientId: string): Promise<AppointmentEntity[]>;
  findByDoctorClinic(doctorClinicId: string, startDate?: Date, endDate?: Date): Promise<AppointmentEntity[]>;
  countAppointmentsForDate(doctorClinicId: string, appointmentDate: Date): Promise<number>;
  findOverlappingAppointments(
    doctorClinicId: string,
    appointmentDate: Date,
    timeSlot: string,
  ): Promise<AppointmentEntity[]>;
  update(id: string, appointment: Partial<AppointmentEntity>): Promise<AppointmentEntity | null>;
}

export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
