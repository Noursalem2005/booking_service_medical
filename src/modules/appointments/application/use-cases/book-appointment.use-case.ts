import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentType } from '../../domain/enums/appointment-type.enum';
import { BookAppointmentDto } from '../dto/book-appointment.dto';

@Injectable()
export class BookAppointmentUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(dto: BookAppointmentDto): Promise<AppointmentEntity> {
    const appointmentDate = new Date(dto.appointmentDate);

    // Overlap validation check
    const overlapping = await this.appointmentRepository.findOverlappingAppointments(
      dto.doctorClinicId,
      appointmentDate,
      dto.timeSlot,
    );

    if (overlapping.length > 0) {
      throw new BadRequestException('The selected time slot is already booked.');
    }

    // Calculate sequential queueNumber for the day
    const currentCount = await this.appointmentRepository.countAppointmentsForDate(
      dto.doctorClinicId,
      appointmentDate,
    );
    const queueNumber = currentCount + 1;
    const estimatedEntryTime = dto.timeSlot;

    return this.appointmentRepository.create({
      patientId: dto.patientId,
      doctorClinicId: dto.doctorClinicId,
      scheduleId: dto.scheduleId,
      appointmentDate,
      timeSlot: dto.timeSlot,
      queueNumber,
      estimatedEntryTime,
      durationMinutes: dto.durationMinutes,
      status: AppointmentStatus.CONFIRMED,
      type: dto.type || AppointmentType.IN_PERSON,
      reasonForVisit: dto.reasonForVisit,
      notes: dto.notes,
      fee: dto.fee || 0,
      isPaid: false,
    });
  }
}
