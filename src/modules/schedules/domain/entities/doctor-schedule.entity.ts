export interface TimeShift {
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "17:00"
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  isWorkingDay: boolean;
  shifts: TimeShift[];
  breaks: TimeShift[];
  avgTimeMinutes?: number;
  maxPatients?: number;
}

export class DoctorScheduleEntity {
  constructor(
    public readonly id: string,
    public readonly doctorClinicId: string,
    public slotDurationMinutes: number,
    public weeklySchedule: DaySchedule[],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
