import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExceptionType } from '../../domain/enums/exception-type.enum';

export class AddScheduleExceptionDto {
  @ApiProperty({ description: 'Doctor ID', example: 'doc_12345' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ description: 'Clinic ID', example: 'clinic_98765' })
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @ApiProperty({ description: 'Start date ISO string', example: '2026-10-10T00:00:00.000Z' })
  @IsISO8601({ strict: true })
  startDate: string;

  @ApiProperty({ description: 'End date ISO string', example: '2026-10-15T23:59:59.000Z' })
  @IsISO8601({ strict: true })
  endDate: string;

  @ApiPropertyOptional({ enum: ExceptionType, description: 'Type of exception', example: ExceptionType.DAY_OFF })
  @IsOptional()
  @IsEnum(ExceptionType)
  type?: ExceptionType;

  @ApiPropertyOptional({ description: 'Reason for vacation or day off', example: 'Annual vacation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
