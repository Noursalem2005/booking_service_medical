import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType } from '../../domain/enums/appointment-type.enum';

export class BookAppointmentDto {
  @ApiProperty({ description: 'Patient User ID', example: 'pat_998877' })
  patientId: string;

  @ApiProperty({ description: 'Doctor-Clinic Junction ID', example: 'dc_12345' })
  doctorClinicId: string;

  @ApiProperty({ description: 'Doctor Schedule ID', example: 'sch_98765' })
  scheduleId: string;

  @ApiProperty({ description: 'Appointment date (YYYY-MM-DD or ISO)', example: '2026-10-01' })
  appointmentDate: string;

  @ApiProperty({ description: 'Time slot string (HH:mm)', example: '14:30' })
  timeSlot: string;

  @ApiProperty({ description: 'Duration of consultation in minutes', example: 30 })
  durationMinutes: number;

  @ApiPropertyOptional({ enum: AppointmentType, description: 'Type of visit', example: AppointmentType.IN_PERSON })
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Reason for visit', example: 'Routine dental checkup' })
  reasonForVisit?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'First visit' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Consultation fee', example: 350 })
  fee?: number;
}
