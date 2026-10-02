import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsISO8601, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { AppointmentType } from '../../domain/enums/appointment-type.enum';
import { TIME_SLOT_REGEX } from '../../../../core/domain/time.util';

export class BookAppointmentDto {
  @ApiProperty({ description: 'Patient User ID', example: 'pat_998877' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Doctor-Clinic Junction ID', example: 'dc_12345' })
  @IsString()
  @IsNotEmpty()
  doctorClinicId: string;

  @ApiProperty({ description: 'Doctor Schedule ID', example: 'sch_98765' })
  @IsString()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({ description: 'Appointment date (YYYY-MM-DD or ISO). Must not be in the past.', example: '2026-10-01' })
  @IsISO8601({ strict: true })
  appointmentDate: string;

  @ApiProperty({ description: 'Time slot string (HH:mm, 24h, UTC)', example: '14:30' })
  @Matches(TIME_SLOT_REGEX, { message: "timeSlot must be in 'HH:mm' 24-hour format" })
  timeSlot: string;

  @ApiProperty({ description: 'Duration of consultation in minutes', example: 30 })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes: number;

  @ApiPropertyOptional({ enum: AppointmentType, description: 'Type of visit', example: AppointmentType.IN_PERSON })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Reason for visit', example: 'Routine dental checkup' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonForVisit?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'First visit' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Consultation fee', example: 350 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;
}
