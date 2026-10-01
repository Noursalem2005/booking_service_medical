import { ApiProperty } from '@nestjs/swagger';

export class TimeShiftDto {
  @ApiProperty({ description: 'Start time string in HH:mm format', example: '09:00' })
  startTime: string;

  @ApiProperty({ description: 'End time string in HH:mm format', example: '17:00' })
  endTime: string;
}

export class DayScheduleDto {
  @ApiProperty({ description: 'Day of week (0 = Sunday, 1 = Monday ... 6 = Saturday)', example: 1 })
  dayOfWeek: number;

  @ApiProperty({ description: 'Whether the doctor works on this day', example: true })
  isWorkingDay: boolean;

  @ApiProperty({ type: [TimeShiftDto], description: 'Working shifts' })
  shifts: TimeShiftDto[];

  @ApiProperty({ type: [TimeShiftDto], description: 'Break times' })
  breaks: TimeShiftDto[];

  @ApiProperty({ description: 'Average time per patient in minutes', example: 30 })
  avgTimeMinutes?: number;

  @ApiProperty({ description: 'Max patients for the day', example: 20 })
  maxPatients?: number;
}

export class SetScheduleDto {
  @ApiProperty({ description: 'Doctor-Clinic Junction ID', example: 'dc_12345' })
  doctorClinicId: string;

  @ApiProperty({ description: 'Slot duration in minutes', example: 30 })
  slotDurationMinutes: number;

  @ApiProperty({ type: [DayScheduleDto], description: 'Weekly working schedule' })
  weeklySchedule: DayScheduleDto[];
}
