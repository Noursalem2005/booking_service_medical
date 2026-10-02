import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../../core/application/dto/pagination-query.dto';
import { PrescriptionStatus } from '../../domain/enums/prescription-status.enum';

export class SearchPrescriptionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by patient', example: 'pat_998877' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by issuing doctor', example: 'doc_12345' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filter by appointment', example: '66f1a2b3c4d5e6f708192a3b' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ description: 'Issued on/after this date (inclusive)', example: '2026-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  issuedFrom?: string;

  @ApiPropertyOptional({ description: 'Issued on/before this date (inclusive)', example: '2026-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  issuedTo?: string;
}

/** Same filters minus patientId – used by GET /prescriptions/patient/:patientId, where the id comes from the path. */
export class PatientPrescriptionHistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by issuing doctor', example: 'doc_12345' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;

  @ApiPropertyOptional({ description: 'Issued on/after this date (inclusive)', example: '2026-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  issuedFrom?: string;

  @ApiPropertyOptional({ description: 'Issued on/before this date (inclusive)', example: '2026-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  issuedTo?: string;
}
