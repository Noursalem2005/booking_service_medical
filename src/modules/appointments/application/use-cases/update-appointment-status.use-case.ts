import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { UpdateAppointmentStatusDto } from '../dto/update-appointment-status.dto';

@Injectable()
export class UpdateAppointmentStatusUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(id: string, dto: UpdateAppointmentStatusDto): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updated = await this.appointmentRepository.update(id, {
      status: dto.status,
    });

    if (!updated) {
      throw new BadRequestException('Failed to update status');
    }

    return updated;
  }
}
