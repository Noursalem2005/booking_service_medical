import { Inject, Injectable } from '@nestjs/common';
import { DOCTOR_SCHEDULE_REPOSITORY } from '../../domain/repositories/doctor-schedule.repository';
import type { IDoctorScheduleRepository } from '../../domain/repositories/doctor-schedule.repository';
import { APPOINTMENT_REPOSITORY } from '../../../appointments/domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository';
import { SCHEDULE_EXCEPTION_REPOSITORY } from '../../domain/repositories/schedule-exception.repository';
import type { IScheduleExceptionRepository } from '../../domain/repositories/schedule-exception.repository';
import { SlotGeneratorService, TimeSlot } from '../../domain/services/slot-generator.service';

@Injectable()
export class GetAvailableSlotsUseCase {
  private slotGenerator = new SlotGeneratorService();

  constructor(
    @Inject(DOCTOR_SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: IDoctorScheduleRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
    @Inject(SCHEDULE_EXCEPTION_REPOSITORY)
    private readonly exceptionRepository: IScheduleExceptionRepository,
  ) {}

  async execute(doctorClinicId: string, dateStr: string): Promise<TimeSlot[]> {
    const schedule = await this.scheduleRepository.findByDoctorClinic(doctorClinicId);
    if (!schedule) {
      return [];
    }

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const existingAppointments = await this.appointmentRepository.findByDoctorClinic(doctorClinicId, startOfDay, endOfDay);
    const exceptions = await this.exceptionRepository.findByDoctorAndDateRange(doctorClinicId, startOfDay, endOfDay);

    return this.slotGenerator.generateSlotsForDate(dateStr, schedule, existingAppointments, exceptions);
  }
}
