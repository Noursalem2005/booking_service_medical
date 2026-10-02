import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import {
  AppointmentNotFoundException,
  SlotAlreadyBookedException,
} from '../../domain/exceptions/appointment.exceptions';
import { RescheduleAppointmentDto } from '../dto/reschedule-appointment.dto';
import { CLOCK } from '../../../../core/application/clock.port';
import type { Clock } from '../../../../core/application/clock.port';
import { isSameUtcDay, startOfUtcDay, toTimeSlot } from '../../../../core/domain/time.util';

@Injectable()
export class RescheduleAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(id: string, dto: RescheduleAppointmentDto): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new AppointmentNotFoundException(id);
    }

    const newStart = new Date(dto.newStartTime);
    const newDate = startOfUtcDay(newStart);
    const newTimeSlot = toTimeSlot(newStart);

    // The NEW slot must be free (ignoring the appointment being moved).
    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      appointment.doctorClinicId,
      newDate,
      newTimeSlot,
    );
    if (overlapping.some((apt) => apt.id !== appointment.id)) {
      throw new SlotAlreadyBookedException();
    }

    // Same day keeps its place in the queue; a different day gets the next number of that day.
    const queueNumber = isSameUtcDay(appointment.appointmentDate, newDate)
      ? appointment.queueNumber
      : await this.appointmentRepository.getNextQueueNumber(appointment.doctorClinicId, newDate);

    // Aggregate enforces: not deleted, still pre-visit, and the new slot is not in the past.
    appointment.reschedule(newDate, newTimeSlot, queueNumber, this.clock.now());

    return this.appointmentRepository.save(appointment);
  }
}
