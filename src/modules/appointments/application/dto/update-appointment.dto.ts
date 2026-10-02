import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Reason for visit (only before the visit starts)', example: 'Follow-up on blood test' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonForVisit?: string;

  @ApiPropertyOptional({ description: 'Visit notes (editable until cancelled / no-show)', example: 'Patient reports mild headache.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
