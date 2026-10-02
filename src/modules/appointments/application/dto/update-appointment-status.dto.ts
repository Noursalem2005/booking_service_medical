import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    description: 'New appointment status. Only legal life-cycle moves are accepted; use the cancel endpoint to cancel.',
    example: AppointmentStatus.CHECKED_IN,
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
