import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentNotFoundException } from '../../domain/exceptions/appointment.exceptions';
import { DeleteAppointmentDto } from '../dto/delete-appointment.dto';
import { CLOCK } from '../../../../core/application/clock.port';
import type { Clock } from '../../../../core/application/clock.port';

/** Soft delete: hides the appointment from all queries and releases its slot. */
@Injectable()
export class DeleteAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(id: string, dto: DeleteAppointmentDto): Promise<void> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundException(id);
    }

    appointment.softDelete(dto.deletedBy, this.clock.now(), dto.reason);

    await this.appointmentRepository.save(appointment);
  }
}
