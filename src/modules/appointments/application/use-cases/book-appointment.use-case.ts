import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentType } from '../../domain/enums/appointment-type.enum';
import { AppointmentSlotPolicy } from '../../domain/policies/appointment-slot.policy';
import { SlotAlreadyBookedException } from '../../domain/exceptions/appointment.exceptions';
import { BookAppointmentDto } from '../dto/book-appointment.dto';
import { CLOCK } from '../../../../core/application/clock.port';
import type { Clock } from '../../../../core/application/clock.port';
import { startOfUtcDay } from '../../../../core/domain/time.util';

@Injectable()
export class BookAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(dto: BookAppointmentDto): Promise<AppointmentEntity> {
    // The day is stored normalised to 00:00 UTC; the time of day lives in `timeSlot`.
    const appointmentDate = startOfUtcDay(new Date(dto.appointmentDate));

    // Rule: no past dates / malformed slots.
    AppointmentSlotPolicy.assertBookable(appointmentDate, dto.timeSlot, this.clock.now());

    // Rule: one active appointment per doctor-clinic slot.
    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      dto.doctorClinicId,
      appointmentDate,
      dto.timeSlot,
    );
    if (overlapping.length > 0) {
      throw new SlotAlreadyBookedException();
    }

    const queueNumber = await this.appointmentRepository.getNextQueueNumber(dto.doctorClinicId, appointmentDate);

    return this.appointmentRepository.create({
      patientId: dto.patientId,
      doctorClinicId: dto.doctorClinicId,
      scheduleId: dto.scheduleId,
      appointmentDate,
      timeSlot: dto.timeSlot,
      queueNumber,
      estimatedEntryTime: dto.timeSlot,
      durationMinutes: dto.durationMinutes,
      status: AppointmentStatus.CONFIRMED,
      type: dto.type || AppointmentType.IN_PERSON,
      reasonForVisit: dto.reasonForVisit?.trim(),
      notes: dto.notes?.trim(),
      fee: dto.fee || 0,
      isPaid: false,
    });
  }
}
