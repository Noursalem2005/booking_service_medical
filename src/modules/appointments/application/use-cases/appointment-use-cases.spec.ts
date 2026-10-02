import { BookAppointmentUseCase } from './book-appointment.use-case';
import { CancelAppointmentUseCase } from './cancel-appointment.use-case';
import { RescheduleAppointmentUseCase } from './reschedule-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from './update-appointment-status.use-case';
import { UpdateAppointmentUseCase } from './update-appointment.use-case';
import { DeleteAppointmentUseCase } from './delete-appointment.use-case';
import { SearchAppointmentsUseCase } from './search-appointments.use-case';
import { AppointmentStatus as S } from '../../domain/enums/appointment-status.enum';
import {
  AppointmentNotFoundException,
  InvalidAppointmentDetailsException,
  InvalidAppointmentSlotException,
  InvalidStatusTransitionException,
  SlotAlreadyBookedException,
} from '../../domain/exceptions/appointment.exceptions';
import { SearchAppointmentsQueryDto } from '../dto/search-appointments-query.dto';
import { InMemoryAppointmentRepository } from '../../../../../test/support/in-memory-appointment.repository';
import { FixedClock, NOW } from '../../../../../test/support/fixed-clock';

const book = (over: Record<string, unknown> = {}) => ({
  patientId: 'pat_1',
  doctorClinicId: 'dc_1',
  scheduleId: 'sch_1',
  appointmentDate: '2026-10-05',
  timeSlot: '10:00',
  durationMinutes: 30,
  ...over,
});

describe('appointment use cases', () => {
  let repo: InMemoryAppointmentRepository;
  let clock: FixedClock;
  let bookUc: BookAppointmentUseCase;

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository();
    clock = new FixedClock(NOW);
    bookUc = new BookAppointmentUseCase(repo, clock);
  });

  describe('book', () => {
    it('books a future slot as CONFIRMED with queue number 1', async () => {
      const a = await bookUc.execute(book());
      expect(a.status).toBe(S.CONFIRMED);
      expect(a.queueNumber).toBe(1);
      expect(a.estimatedEntryTime).toBe('10:00');
    });

    it('normalises an ISO datetime to the day (time lives in timeSlot)', async () => {
      const a = await bookUc.execute(book({ appointmentDate: '2026-10-05T17:45:00.000Z' }));
      expect(a.appointmentDate.toISOString()).toBe('2026-10-05T00:00:00.000Z');
    });

    it('rejects past dates and earlier-today slots', async () => {
      await expect(bookUc.execute(book({ appointmentDate: '2026-10-01' }))).rejects.toThrow(InvalidAppointmentSlotException);
      await expect(bookUc.execute(book({ appointmentDate: '2026-10-02', timeSlot: '08:00' }))).rejects.toThrow(InvalidAppointmentSlotException);
      expect(repo.rows.size).toBe(0);
    });

    it('rejects a double booking, but allows re-booking a cancelled slot', async () => {
      const first = await bookUc.execute(book());
      await expect(bookUc.execute(book({ patientId: 'pat_2' }))).rejects.toThrow(SlotAlreadyBookedException);

      await new CancelAppointmentUseCase(repo).execute(first.id, { reason: 'x', cancelledBy: 'u' });
      await expect(bookUc.execute(book({ patientId: 'pat_2' }))).resolves.toBeDefined();
    });

    it('never reuses a queue number after a cancellation', async () => {
      const a1 = await bookUc.execute(book({ timeSlot: '10:00' }));
      await bookUc.execute(book({ timeSlot: '10:30' }));
      await new CancelAppointmentUseCase(repo).execute(a1.id, { reason: 'x', cancelledBy: 'u' });
      const a3 = await bookUc.execute(book({ timeSlot: '11:00' }));
      expect(a3.queueNumber).toBe(3); // old logic (count+1) would have produced 2 – a duplicate
    });
  });

  describe('status & cancel', () => {
    it('applies legal moves and rejects un-cancelling', async () => {
      const a = await bookUc.execute(book());
      const status = new UpdateAppointmentStatusUseCase(repo);
      expect((await status.execute(a.id, { status: S.CHECKED_IN })).status).toBe(S.CHECKED_IN);

      await new CancelAppointmentUseCase(repo).execute(a.id, { reason: 'x', cancelledBy: 'u' });
      await expect(status.execute(a.id, { status: S.CONFIRMED })).rejects.toThrow(InvalidStatusTransitionException);
    });

    it('404s for unknown ids', async () => {
      await expect(new CancelAppointmentUseCase(repo).execute('nope', { reason: 'x', cancelledBy: 'u' })).rejects.toThrow(AppointmentNotFoundException);
      await expect(new UpdateAppointmentStatusUseCase(repo).execute('nope', { status: S.CHECKED_IN })).rejects.toThrow(AppointmentNotFoundException);
    });
  });

  describe('reschedule', () => {
    it('moves to a new day and takes the next queue number of that day', async () => {
      const a = await bookUc.execute(book());
      await bookUc.execute(book({ appointmentDate: '2026-10-07', timeSlot: '09:00', patientId: 'pat_2' }));

      const moved = await new RescheduleAppointmentUseCase(repo, clock).execute(a.id, { newStartTime: '2026-10-07T12:30:00.000Z' });
      expect(moved.appointmentDate.toISOString()).toBe('2026-10-07T00:00:00.000Z');
      expect(moved.timeSlot).toBe('12:30');
      expect(moved.queueNumber).toBe(2);
    });

    it('keeps the queue number when moving within the same day', async () => {
      const a = await bookUc.execute(book());
      const moved = await new RescheduleAppointmentUseCase(repo, clock).execute(a.id, { newStartTime: '2026-10-05T15:00:00.000Z' });
      expect(moved.queueNumber).toBe(a.queueNumber);
      expect(moved.timeSlot).toBe('15:00');
    });

    it('rejects a taken slot, a past time, and a non-pre-visit appointment', async () => {
      const a = await bookUc.execute(book());
      const b = await bookUc.execute(book({ timeSlot: '11:00', patientId: 'pat_2' }));
      const uc = new RescheduleAppointmentUseCase(repo, clock);

      await expect(uc.execute(a.id, { newStartTime: '2026-10-05T11:00:00.000Z' })).rejects.toThrow(SlotAlreadyBookedException);
      await expect(uc.execute(a.id, { newStartTime: '2026-10-01T11:00:00.000Z' })).rejects.toThrow(InvalidAppointmentSlotException);

      await new UpdateAppointmentStatusUseCase(repo).execute(b.id, { status: S.CHECKED_IN });
      await expect(uc.execute(b.id, { newStartTime: '2026-10-06T11:00:00.000Z' })).rejects.toThrow();
    });
  });

  describe('visit notes', () => {
    it('updates notes and reason; empty patch is rejected', async () => {
      const a = await bookUc.execute(book());
      const uc = new UpdateAppointmentUseCase(repo);
      const updated = await uc.execute(a.id, { notes: 'Fasting required', reasonForVisit: 'Blood test' });
      expect(updated.notes).toBe('Fasting required');
      await expect(uc.execute(a.id, {})).rejects.toThrow(InvalidAppointmentDetailsException);
    });
  });

  describe('soft delete', () => {
    it('hides the appointment everywhere and frees the slot', async () => {
      const a = await bookUc.execute(book());
      await new DeleteAppointmentUseCase(repo, clock).execute(a.id, { deletedBy: 'usr_1', reason: 'Duplicate' });

      expect(await repo.findById(a.id)).toBeNull();
      expect(await repo.findByPatientId('pat_1')).toHaveLength(0);
      expect(repo.rows.get(a.id)?.deletedAt).toEqual(NOW); // still stored
      await expect(bookUc.execute(book({ patientId: 'pat_2' }))).resolves.toBeDefined();
      await expect(new DeleteAppointmentUseCase(repo, clock).execute(a.id, { deletedBy: 'u' })).rejects.toThrow(AppointmentNotFoundException);
    });
  });

  describe('search', () => {
    const q = (over: Partial<SearchAppointmentsQueryDto> = {}) =>
      Object.assign(new SearchAppointmentsQueryDto(), { page: 1, limit: 20, sortOrder: 'asc', ...over });

    beforeEach(async () => {
      await bookUc.execute(book({ appointmentDate: '2026-10-05', timeSlot: '10:00' }));
      const b = await bookUc.execute(book({ appointmentDate: '2026-10-06', timeSlot: '10:00', patientId: 'pat_2' }));
      await bookUc.execute(book({ appointmentDate: '2026-10-07', timeSlot: '10:00', doctorClinicId: 'dc_2' }));
      await new CancelAppointmentUseCase(repo).execute(b.id, { reason: 'x', cancelledBy: 'u' });
    });

    it('filters by inclusive date range', async () => {
      const uc = new SearchAppointmentsUseCase(repo);
      const r = await uc.execute(q({ dateFrom: '2026-10-06', dateTo: '2026-10-07' }));
      expect(r.total).toBe(2);
      const single = await uc.execute(q({ dateFrom: '2026-10-05', dateTo: '2026-10-05' }));
      expect(single.total).toBe(1);
    });

    it('filters by status(es), patient and doctor', async () => {
      const uc = new SearchAppointmentsUseCase(repo);
      expect((await uc.execute(q({ status: [S.CANCELLED] }))).total).toBe(1);
      expect((await uc.execute(q({ status: [S.CANCELLED, S.CONFIRMED] }))).total).toBe(3);
      expect((await uc.execute(q({ patientId: 'pat_2' }))).total).toBe(1);
      expect((await uc.execute(q({ doctorClinicId: 'dc_2' }))).total).toBe(1);
      expect((await uc.execute(q({ doctorClinicId: 'dc_1', status: [S.CONFIRMED] }))).total).toBe(1);
    });

    it('paginates and sorts', async () => {
      const uc = new SearchAppointmentsUseCase(repo);
      const p1 = await uc.execute(q({ limit: 2, sortOrder: 'desc' }));
      expect(p1.items).toHaveLength(2);
      expect(p1.total).toBe(3);
      expect(p1.totalPages).toBe(2);
      expect(p1.items[0].appointmentDate > p1.items[1].appointmentDate).toBe(true);
    });

    it('rejects an inverted date range', async () => {
      await expect(new SearchAppointmentsUseCase(repo).execute(q({ dateFrom: '2026-10-09', dateTo: '2026-10-01' }))).rejects.toThrow(InvalidAppointmentDetailsException);
    });
  });
});
