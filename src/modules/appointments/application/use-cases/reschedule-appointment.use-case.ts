import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';

@Injectable()
export class RescheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(id: string, dto: RescheduleAppointmentDto): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const start = new Date(dto.newStartTime);

    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      appointment.doctorClinicId,
      start,
      appointment.timeSlot,
    );

    const otherOverlaps = overlapping.filter((apt) => apt.id !== id);
    if (otherOverlaps.length > 0) {
      throw new BadRequestException('The requested reschedule time slot is already booked.');
    }

    const updated = await this.appointmentRepository.update(id, {
      appointmentDate: start,
    });

    if (!updated) {
      throw new BadRequestException('Failed to reschedule appointment');
    }

    return updated;
  }
}
