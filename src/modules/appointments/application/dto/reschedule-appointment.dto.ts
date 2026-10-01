import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'New start time ISO string', example: '2026-10-02T10:00:00.000Z' })
  newStartTime: string;
}
