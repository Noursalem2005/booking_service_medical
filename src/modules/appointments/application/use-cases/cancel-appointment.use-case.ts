import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';

@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(id: string, dto: CancelAppointmentDto): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.cancel(dto.reason, dto.cancelledBy);

    const updated = await this.appointmentRepository.update(id, {
      status: appointment.status,
      cancellationReason: appointment.cancellationReason,
      cancelledBy: appointment.cancelledBy,
    });

    if (!updated) {
      throw new BadRequestException('Failed to cancel appointment');
    }

    return updated;
  }
}
