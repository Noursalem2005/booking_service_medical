import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { AppointmentNotFoundException } from '../../domain/exceptions/appointment.exceptions';
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
      throw new AppointmentNotFoundException(id);
    }

    // Throws InvalidStatusTransitionException for illegal moves (e.g. CANCELLED -> CONFIRMED).
    appointment.changeStatus(dto.status);

    return this.appointmentRepository.save(appointment);
  }
}
