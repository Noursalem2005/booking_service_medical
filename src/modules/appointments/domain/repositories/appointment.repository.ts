import { PaginatedResult } from '../../../../core/domain/pagination';
import { AppointmentEntity } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export interface AppointmentSearchCriteria {
  patientId?: string;
  doctorClinicId?: string;
  statuses?: AppointmentStatus[];
  /** Inclusive lower bound on appointmentDate (start of day, UTC). */
  dateFrom?: Date;
  /** Inclusive upper bound on appointmentDate (end of day, UTC). */
  dateTo?: Date;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Soft-deleted appointments are invisible through every method of this port.
 */
export interface IAppointmentRepository {
  create(appointment: Partial<AppointmentEntity>): Promise<AppointmentEntity>;
  /** Persists the mutable state of an aggregate that was changed through its domain methods. */
  save(appointment: AppointmentEntity): Promise<AppointmentEntity>;
  findById(id: string): Promise<AppointmentEntity | null>;
  findByPatientId(patientId: string): Promise<AppointmentEntity[]>;
  findByDoctorClinic(doctorClinicId: string, startDate?: Date, endDate?: Date): Promise<AppointmentEntity[]>;
  search(criteria: AppointmentSearchCriteria): Promise<PaginatedResult<AppointmentEntity>>;
  /** Next queue number of the day: highest number ever issued that day + 1 (cancelled numbers are never reused). */
  getNextQueueNumber(doctorClinicId: string, appointmentDate: Date): Promise<number>;
  findOverlappingAppointments(
    doctorClinicId: string,
    appointmentDate: Date,
    timeSlot: string,
  ): Promise<AppointmentEntity[]>;
}

export const APPOINTMENT_REPOSITORY = Symbol('IAppointmentRepository');
