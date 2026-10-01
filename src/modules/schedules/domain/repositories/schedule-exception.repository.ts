import { ScheduleExceptionEntity } from '../entities/schedule-exception.entity';

export interface IScheduleExceptionRepository {
  create(exception: Partial<ScheduleExceptionEntity>): Promise<ScheduleExceptionEntity>;
  findByDoctorAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<ScheduleExceptionEntity[]>;
  delete(id: string): Promise<boolean>;
}

export const SCHEDULE_EXCEPTION_REPOSITORY = Symbol('IScheduleExceptionRepository');
