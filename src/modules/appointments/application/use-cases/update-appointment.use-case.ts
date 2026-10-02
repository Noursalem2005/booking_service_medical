import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { AppointmentNotFoundException } from '../../domain/exceptions/appointment.exceptions';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

/** Updates visit notes and/or the reason for visit. */
@Injectable()
export class UpdateAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(id: string, dto: UpdateAppointmentDto): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundException(id);
    }

    appointment.updateDetails({ reasonForVisit: dto.reasonForVisit, notes: dto.notes });

    return this.appointmentRepository.save(appointment);
  }
}
