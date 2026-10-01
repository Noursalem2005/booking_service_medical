import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, description: 'New appointment status', example: AppointmentStatus.CHECKED_IN })
  status: AppointmentStatus;
}
