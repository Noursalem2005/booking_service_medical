import { DoctorScheduleEntity } from '../entities/doctor-schedule.entity';

export interface IDoctorScheduleRepository {
  upsertSchedule(schedule: Partial<DoctorScheduleEntity>): Promise<DoctorScheduleEntity>;
  findByDoctorClinic(doctorClinicId: string): Promise<DoctorScheduleEntity | null>;
}

export const DOCTOR_SCHEDULE_REPOSITORY = Symbol('IDoctorScheduleRepository');
