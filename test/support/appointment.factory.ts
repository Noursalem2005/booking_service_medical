import { AppointmentEntity } from '../../src/modules/appointments/domain/entities/appointment.entity';
import { AppointmentStatus } from '../../src/modules/appointments/domain/enums/appointment-status.enum';
import { AppointmentType } from '../../src/modules/appointments/domain/enums/appointment-type.enum';

export function makeAppointment(overrides: Partial<AppointmentEntity> = {}): AppointmentEntity {
  const a = new AppointmentEntity(
    overrides.id ?? 'apt_x',
    'BOOK-apt_x',
    overrides.patientId ?? 'pat_1',
    overrides.doctorClinicId ?? 'dc_1',
    'sch_1',
    overrides.appointmentDate ?? new Date('2026-10-05T00:00:00.000Z'),
    overrides.timeSlot ?? '10:00',
    overrides.queueNumber ?? 1,
    overrides.timeSlot ?? '10:00',
    30,
    overrides.status ?? AppointmentStatus.CONFIRMED,
    AppointmentType.IN_PERSON,
    overrides.reasonForVisit,
    overrides.notes,
  );
  return a;
}
