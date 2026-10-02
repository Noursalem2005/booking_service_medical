import { PrescriptionEntity } from '../../src/modules/prescriptions/domain/entities/prescription.entity';
import type {
  IPrescriptionRepository,
  PrescriptionSearchCriteria,
} from '../../src/modules/prescriptions/domain/repositories/prescription.repository';
import { toPaginatedResult } from '../../src/core/domain/pagination';

export class InMemoryPrescriptionRepository implements IPrescriptionRepository {
  readonly rows = new Map<string, PrescriptionEntity>();

  async save(p: PrescriptionEntity) {
    this.rows.set(p.id, p);
    return p;
  }

  async findById(id: string) {
    return this.rows.get(id) ?? null;
  }

  async search(c: PrescriptionSearchCriteria) {
    const list = [...this.rows.values()]
      .filter(
        (p) =>
          (!c.patientId || p.patientId === c.patientId) &&
          (!c.doctorId || p.doctorId === c.doctorId) &&
          (!c.appointmentId || p.appointmentId === c.appointmentId) &&
          (!c.status || p.status === c.status) &&
          (!c.issuedFrom || p.issuedAt >= c.issuedFrom) &&
          (!c.issuedTo || p.issuedAt <= c.issuedTo),
      )
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
    return toPaginatedResult(list.slice((c.page - 1) * c.limit, c.page * c.limit), list.length, c.page, c.limit);
  }
}
