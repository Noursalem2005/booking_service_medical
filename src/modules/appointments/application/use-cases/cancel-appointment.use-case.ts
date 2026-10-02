import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { AppointmentNotFoundException } from '../../domain/exceptions/appointment.exceptions';
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
      throw new AppointmentNotFoundException(id);
    }

    appointment.cancel(dto.reason, dto.cancelledBy);

    return this.appointmentRepository.save(appointment);
  }
}
