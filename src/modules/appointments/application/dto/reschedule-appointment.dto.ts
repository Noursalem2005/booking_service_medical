import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'New start time ISO string (UTC). Must not be in the past.', example: '2026-10-02T10:00:00.000Z' })
  @IsISO8601({ strict: true })
  newStartTime: string;
}
