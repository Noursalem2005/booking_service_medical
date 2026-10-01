import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'Reason for cancellation', example: 'Patient scheduling conflict' })
  reason: string;

  @ApiProperty({ description: 'User ID of person cancelling', example: 'usr_12345' })
  cancelledBy: string;
}
