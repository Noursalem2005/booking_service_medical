import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ description: 'Reason for cancellation', example: 'Patient scheduling conflict' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ description: 'User ID of person cancelling', example: 'usr_12345' })
  @IsString()
  @IsNotEmpty()
  cancelledBy: string;
}
