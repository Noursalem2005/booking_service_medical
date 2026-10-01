import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExceptionType } from '../../domain/enums/exception-type.enum';

export class AddScheduleExceptionDto {
  @ApiProperty({ description: 'Doctor ID', example: 'doc_12345' })
  doctorId: string;

  @ApiProperty({ description: 'Clinic ID', example: 'clinic_98765' })
  clinicId: string;

  @ApiProperty({ description: 'Start date ISO string', example: '2026-10-10T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ description: 'End date ISO string', example: '2026-10-15T23:59:59.000Z' })
  endDate: string;

  @ApiPropertyOptional({ enum: ExceptionType, description: 'Type of exception', example: ExceptionType.DAY_OFF })
  type?: ExceptionType;

  @ApiPropertyOptional({ description: 'Reason for vacation or day off', example: 'Annual vacation' })
  reason?: string;
}
