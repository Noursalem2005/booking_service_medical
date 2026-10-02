import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { TIME_SLOT_REGEX } from '../../../../core/domain/time.util';

export class TimeShiftDto {
  @ApiProperty({ description: 'Start time string in HH:mm format', example: '09:00' })
  @Matches(TIME_SLOT_REGEX, { message: "startTime must be in 'HH:mm' 24-hour format" })
  startTime: string;

  @ApiProperty({ description: 'End time string in HH:mm format', example: '17:00' })
  @Matches(TIME_SLOT_REGEX, { message: "endTime must be in 'HH:mm' 24-hour format" })
  endTime: string;
}

export class DayScheduleDto {
  @ApiProperty({ description: 'Day of week (0 = Sunday, 1 = Monday ... 6 = Saturday)', example: 1 })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Whether the doctor works on this day', example: true })
  @IsBoolean()
  isWorkingDay: boolean;

  @ApiProperty({ type: [TimeShiftDto], description: 'Working shifts' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeShiftDto)
  shifts: TimeShiftDto[];

  @ApiProperty({ type: [TimeShiftDto], description: 'Break times' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeShiftDto)
  breaks: TimeShiftDto[];

  @ApiProperty({ description: 'Average time per patient in minutes', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  avgTimeMinutes?: number;

  @ApiProperty({ description: 'Max patients for the day', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPatients?: number;
}

export class SetScheduleDto {
  @ApiProperty({ description: 'Doctor-Clinic Junction ID', example: 'dc_12345' })
  @IsString()
  @IsNotEmpty()
  doctorClinicId: string;

  @ApiProperty({ description: 'Slot duration in minutes', example: 30 })
  @IsInt()
  @Min(5)
  @Max(480)
  slotDurationMinutes: number;

  @ApiProperty({ type: [DayScheduleDto], description: 'Weekly working schedule' })
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  weeklySchedule: DayScheduleDto[];
}
