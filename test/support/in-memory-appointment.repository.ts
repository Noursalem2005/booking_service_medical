import { AppointmentEntity } from '../../src/modules/appointments/domain/entities/appointment.entity';
import { AppointmentStatus } from '../../src/modules/appointments/domain/enums/appointment-status.enum';
import { AppointmentType } from '../../src/modules/appointments/domain/enums/appointment-type.enum';
import type {
  AppointmentSearchCriteria,
  IAppointmentRepository,
} from '../../src/modules/appointments/domain/repositories/appointment.repository';
import { endOfUtcDay, startOfUtcDay } from '../../src/core/domain/time.util';
import { toPaginatedResult } from '../../src/core/domain/pagination';

/** Behaves like the Mongo repository (soft-deleted rows are invisible) – for use-case tests. */
export class InMemoryAppointmentRepository implements IAppointmentRepository {
  readonly rows = new Map<string, AppointmentEntity>();
  private seq = 0;

  private visible(): AppointmentEntity[] {
    return [...this.rows.values()].filter((a) => !a.deletedAt);
  }

  async create(data: Partial<AppointmentEntity>): Promise<AppointmentEntity> {
    const id = `apt_${++this.seq}`;
    const entity = new AppointmentEntity(
      id,
      `BOOK-${id}`,
      data.patientId!,
      data.doctorClinicId!,
      data.scheduleId!,
      data.appointmentDate!,
      data.timeSlot!,
      data.queueNumber!,
      data.estimatedEntryTime!,
      data.durationMinutes!,
      data.status ?? AppointmentStatus.CONFIRMED,
      data.type ?? AppointmentType.IN_PERSON,
      data.reasonForVisit,
      data.notes,
      undefined,
      undefined,
      data.fee ?? 0,
      data.isPaid ?? false,
    );
    this.rows.set(id, entity);
    return entity;
  }

  async save(a: AppointmentEntity): Promise<AppointmentEntity> {
    this.rows.set(a.id, a);
    return a;
  }

  async findById(id: string) {
    const a = this.rows.get(id);
    return a && !a.deletedAt ? a : null;
  }

  async findByPatientId(patientId: string) {
    return this.visible().filter((a) => a.patientId === patientId);
  }

  async findByDoctorClinic(doctorClinicId: string, start?: Date, end?: Date) {
    return this.visible().filter(
      (a) =>
        a.doctorClinicId === doctorClinicId &&
        (!start || a.appointmentDate >= start) &&
        (!end || a.appointmentDate <= end),
    );
  }

  async search(c: AppointmentSearchCriteria) {
    let list = this.visible().filter(
      (a) =>
        (!c.patientId || a.patientId === c.patientId) &&
        (!c.doctorClinicId || a.doctorClinicId === c.doctorClinicId) &&
        (!c.statuses || c.statuses.includes(a.status)) &&
        (!c.dateFrom || a.appointmentDate >= c.dateFrom) &&
        (!c.dateTo || a.appointmentDate <= c.dateTo),
    );
    const dir = c.sortOrder === 'desc' ? -1 : 1;
    list = list.sort(
      (x, y) => dir * (x.slotStart.getTime() - y.slotStart.getTime()),
    );
    const page = list.slice((c.page - 1) * c.limit, c.page * c.limit);
    return toPaginatedResult(page, list.length, c.page, c.limit);
  }

  async getNextQueueNumber(doctorClinicId: string, date: Date) {
    const from = startOfUtcDay(date);
    const to = endOfUtcDay(date);
    const numbers = [...this.rows.values()]
      .filter((a) => a.doctorClinicId === doctorClinicId && a.appointmentDate >= from && a.appointmentDate <= to)
      .map((a) => a.queueNumber);
    return (numbers.length ? Math.max(...numbers) : 0) + 1;
  }

  async findOverlappingAppointments(doctorClinicId: string, date: Date, timeSlot: string) {
    const from = startOfUtcDay(date);
    const to = endOfUtcDay(date);
    return this.visible().filter(
      (a) =>
        a.doctorClinicId === doctorClinicId &&
        a.appointmentDate >= from &&
        a.appointmentDate <= to &&
        a.timeSlot === timeSlot &&
        a.status !== AppointmentStatus.CANCELLED,
    );
  }
}
