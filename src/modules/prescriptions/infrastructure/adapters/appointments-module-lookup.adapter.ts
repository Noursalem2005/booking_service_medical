import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../../appointments/domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../../appointments/domain/repositories/appointment.repository';
import { AppointmentStatus } from '../../../appointments/domain/enums/appointment-status.enum';
import type { AppointmentLookupPort, AppointmentSnapshot } from '../../domain/ports/appointment-lookup.port';

const ATTENDED_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.CHECKED_IN,
  AppointmentStatus.IN_PROGRESS,
  AppointmentStatus.COMPLETED,
];

/**
 * In-process adapter: translates the Appointments model into Prescriptions' own snapshot.
 * Replace this single class with an HTTP/gRPC client when the contexts become separate services.
 */
@Injectable()
export class AppointmentsModuleLookupAdapter implements AppointmentLookupPort {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async findById(appointmentId: string): Promise<AppointmentSnapshot | null> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) return null;

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorClinicId: appointment.doctorClinicId,
      patientAttended: ATTENDED_STATUSES.includes(appointment.status),
    };
  }
}
