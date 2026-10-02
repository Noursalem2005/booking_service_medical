import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../core/application/dto/pagination-query.dto';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

const toStringArray = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.split(',').map((v) => v.trim()).filter(Boolean)
    : value;

export class SearchAppointmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by patient', example: 'pat_998877' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor-clinic junction (the doctor)', example: 'dc_12345' })
  @IsOptional()
  @IsString()
  doctorClinicId?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    isArray: true,
    description: 'One or more statuses – comma separated (CONFIRMED,CHECKED_IN) or repeated',
  })
  @IsOptional()
  @Transform(toStringArray)
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  status?: AppointmentStatus[];

  @ApiPropertyOptional({ description: 'Appointments on/after this date (inclusive)', example: '2026-10-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Appointments on/before this date (inclusive)', example: '2026-10-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc', description: 'Sort by date, then time slot' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
