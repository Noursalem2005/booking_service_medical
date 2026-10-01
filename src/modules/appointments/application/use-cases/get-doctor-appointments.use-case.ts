import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';

@Injectable()
export class GetDoctorAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(doctorClinicId: string, dateStr?: string): Promise<AppointmentEntity[]> {
    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      return this.appointmentRepository.findByDoctorClinic(doctorClinicId, startOfDay, endOfDay);
    }
    return this.appointmentRepository.findByDoctorClinic(doctorClinicId);
  }
}
