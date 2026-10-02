import { IssuePrescriptionUseCase } from './issue-prescription.use-case';
import { GetPrescriptionUseCase } from './get-prescription.use-case';
import { SearchPrescriptionsUseCase } from './search-prescriptions.use-case';
import { CancelPrescriptionUseCase } from './cancel-prescription.use-case';
import type { AppointmentLookupPort, AppointmentSnapshot } from '../../domain/ports/appointment-lookup.port';
import { PrescriptionStatus } from '../../domain/enums/prescription-status.enum';
import {
  InvalidPrescriptionException,
  PrescriptionAppointmentNotFoundException,
  PrescriptionNotFoundException,
  VisitNotAttendedException,
} from '../../domain/exceptions/prescription.exceptions';
import { IssuePrescriptionDto } from '../dto/issue-prescription.dto';
import { InMemoryPrescriptionRepository } from '../../../../../test/support/in-memory-prescription.repository';
import { FixedClock, NOW } from '../../../../../test/support/fixed-clock';

class FakeAppointmentLookup implements AppointmentLookupPort {
  constructor(private readonly snapshots: AppointmentSnapshot[]) {}
  async findById(id: string) {
    return this.snapshots.find((s) => s.id === id) ?? null;
  }
}

const attended: AppointmentSnapshot = { id: 'apt_1', patientId: 'pat_1', doctorClinicId: 'dc_1', patientAttended: true };
const notAttended: AppointmentSnapshot = { id: 'apt_2', patientId: 'pat_2', doctorClinicId: 'dc_1', patientAttended: false };

const dto = (over: Partial<IssuePrescriptionDto> = {}): IssuePrescriptionDto => ({
  appointmentId: 'apt_1',
  doctorId: 'doc_1',
  items: [{ medicationName: 'Amoxicillin', dosage: '500 mg', frequency: 'twice daily', durationDays: 7 }],
  ...over,
});

describe('prescription use cases', () => {
  let repo: InMemoryPrescriptionRepository;
  let clock: FixedClock;
  let issue: IssuePrescriptionUseCase;

  beforeEach(() => {
    repo = new InMemoryPrescriptionRepository();
    clock = new FixedClock(NOW);
    issue = new IssuePrescriptionUseCase(repo, new FakeAppointmentLookup([attended, notAttended]), clock);
  });

  describe('issue', () => {
    it('derives patient and clinic from the appointment and generates a code', async () => {
      const rx = await issue.execute(dto());
      expect(rx.patientId).toBe('pat_1');
      expect(rx.doctorClinicId).toBe('dc_1');
      expect(rx.doctorId).toBe('doc_1');
      expect(rx.prescriptionCode).toMatch(/^RX-20261002-[0-9A-F]{6}$/);
      expect(rx.issuedAt).toEqual(NOW);
      expect(repo.rows.size).toBe(1);
    });

    it('rejects an unknown appointment', async () => {
      await expect(issue.execute(dto({ appointmentId: 'ghost' }))).rejects.toThrow(PrescriptionAppointmentNotFoundException);
    });

    it('rejects when the patient has not been checked in', async () => {
      await expect(issue.execute(dto({ appointmentId: 'apt_2' }))).rejects.toThrow(VisitNotAttendedException);
      expect(repo.rows.size).toBe(0);
    });

    it('propagates domain validation (no items) without saving', async () => {
      await expect(issue.execute(dto({ items: [] }))).rejects.toThrow(InvalidPrescriptionException);
      expect(repo.rows.size).toBe(0);
    });

    it('generates distinct ids and codes', async () => {
      const [a, b] = [await issue.execute(dto()), await issue.execute(dto())];
      expect(a.id).not.toBe(b.id);
      expect(a.prescriptionCode).not.toBe(b.prescriptionCode);
    });
  });

  describe('get / cancel', () => {
    it('gets by id or 404s', async () => {
      const rx = await issue.execute(dto());
      expect((await new GetPrescriptionUseCase(repo).execute(rx.id)).id).toBe(rx.id);
      await expect(new GetPrescriptionUseCase(repo).execute('nope')).rejects.toThrow(PrescriptionNotFoundException);
    });

    it('cancels and keeps the record', async () => {
      const rx = await issue.execute(dto());
      const cancelled = await new CancelPrescriptionUseCase(repo, clock).execute(rx.id, { reason: 'typo', cancelledBy: 'doc_1' });
      expect(cancelled.status).toBe(PrescriptionStatus.CANCELLED);
      expect(repo.rows.size).toBe(1);
      await expect(new CancelPrescriptionUseCase(repo, clock).execute('nope', { reason: 'x', cancelledBy: 'y' })).rejects.toThrow(PrescriptionNotFoundException);
    });
  });

  describe('history / search', () => {
    const base = { page: 1, limit: 20 };

    beforeEach(async () => {
      await issue.execute(dto()); // pat_1, doc_1, 2 Oct
      clock.set(new Date('2026-10-10T09:00:00.000Z'));
      await issue.execute(dto({ doctorId: 'doc_2' })); // pat_1, doc_2, 10 Oct
      clock.set(NOW);
    });

    it('returns a patient history newest first', async () => {
      const r = await new SearchPrescriptionsUseCase(repo).execute({ ...base, patientId: 'pat_1' });
      expect(r.total).toBe(2);
      expect(r.items[0].doctorId).toBe('doc_2');
    });

    it('filters by doctor, status and issue-date range', async () => {
      const uc = new SearchPrescriptionsUseCase(repo);
      expect((await uc.execute({ ...base, doctorId: 'doc_1' })).total).toBe(1);
      expect((await uc.execute({ ...base, status: PrescriptionStatus.CANCELLED })).total).toBe(0);
      expect((await uc.execute({ ...base, issuedFrom: '2026-10-05' })).total).toBe(1);
      expect((await uc.execute({ ...base, issuedFrom: '2026-10-02', issuedTo: '2026-10-02' })).total).toBe(1);
      expect((await uc.execute({ ...base, patientId: 'nobody' })).total).toBe(0);
    });

    it('rejects an inverted range', async () => {
      await expect(new SearchPrescriptionsUseCase(repo).execute({ ...base, issuedFrom: '2026-12-01', issuedTo: '2026-01-01' })).rejects.toThrow(InvalidPrescriptionException);
    });
  });
});
