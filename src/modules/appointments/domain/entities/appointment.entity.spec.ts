import { AppointmentStatus as S } from '../enums/appointment-status.enum';
import {
  AppointmentNotModifiableException,
  InvalidAppointmentDetailsException,
  InvalidAppointmentSlotException,
  InvalidStatusTransitionException,
} from '../exceptions/appointment.exceptions';
import { ALLOWED_STATUS_TRANSITIONS } from '../policies/appointment-status.policy';
import { makeAppointment } from '../../../../../test/support/appointment.factory';
import { NOW } from '../../../../../test/support/fixed-clock';

describe('AppointmentEntity – status machine', () => {
  it('walks the happy path CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED', () => {
    const a = makeAppointment({ status: S.CONFIRMED });
    a.changeStatus(S.CHECKED_IN);
    a.changeStatus(S.IN_PROGRESS);
    a.complete();
    expect(a.status).toBe(S.COMPLETED);
  });

  it('cannot un-cancel an appointment (any target status is rejected)', () => {
    const a = makeAppointment({ status: S.CONFIRMED });
    a.cancel('changed my mind', 'usr_1');
    for (const target of [S.PENDING, S.CONFIRMED, S.CHECKED_IN, S.IN_PROGRESS, S.COMPLETED, S.NO_SHOW]) {
      expect(() => a.changeStatus(target)).toThrow(InvalidStatusTransitionException);
    }
    expect(a.status).toBe(S.CANCELLED);
  });

  it('terminal statuses have no outgoing transitions', () => {
    expect(ALLOWED_STATUS_TRANSITIONS[S.COMPLETED]).toEqual([]);
    expect(ALLOWED_STATUS_TRANSITIONS[S.CANCELLED]).toEqual([]);
    expect(ALLOWED_STATUS_TRANSITIONS[S.NO_SHOW]).toEqual([]);
  });

  it('rejects skipping steps (CONFIRMED → COMPLETED) and going backwards', () => {
    expect(() => makeAppointment({ status: S.CONFIRMED }).changeStatus(S.COMPLETED)).toThrow(InvalidStatusTransitionException);
    expect(() => makeAppointment({ status: S.IN_PROGRESS }).changeStatus(S.CHECKED_IN)).toThrow(InvalidStatusTransitionException);
  });

  it('cancelling via the generic status change is refused (a reason is mandatory)', () => {
    expect(() => makeAppointment().changeStatus(S.CANCELLED)).toThrow(InvalidAppointmentDetailsException);
  });

  it('cannot cancel a completed or already cancelled appointment', () => {
    expect(() => makeAppointment({ status: S.COMPLETED }).cancel('x', 'u')).toThrow(InvalidStatusTransitionException);
    const a = makeAppointment();
    a.cancel('x', 'u');
    expect(() => a.cancel('again', 'u')).toThrow(InvalidStatusTransitionException);
  });

  it('records who cancelled and why; blank reason is rejected', () => {
    const a = makeAppointment();
    expect(() => a.cancel('  ', 'u')).toThrow(InvalidAppointmentDetailsException);
    a.cancel('  Patient is sick ', 'usr_9');
    expect(a.cancellationReason).toBe('Patient is sick');
    expect(a.cancelledBy).toBe('usr_9');
  });
});

describe('AppointmentEntity – reschedule', () => {
  const newDate = new Date('2026-10-07T00:00:00.000Z');

  it('moves date, slot, estimated entry time and queue number', () => {
    const a = makeAppointment();
    a.reschedule(newDate, '11:30', 4, NOW);
    expect(a.appointmentDate).toEqual(newDate);
    expect(a.timeSlot).toBe('11:30');
    expect(a.estimatedEntryTime).toBe('11:30');
    expect(a.queueNumber).toBe(4);
  });

  it('refuses a past slot', () => {
    const a = makeAppointment();
    expect(() => a.reschedule(new Date('2026-10-01T00:00:00.000Z'), '10:00', 1, NOW)).toThrow(InvalidAppointmentSlotException);
    // earlier TODAY is also in the past
    expect(() => a.reschedule(new Date('2026-10-02T00:00:00.000Z'), '08:00', 1, NOW)).toThrow(InvalidAppointmentSlotException);
  });

  it.each([S.CHECKED_IN, S.IN_PROGRESS, S.COMPLETED, S.CANCELLED, S.NO_SHOW])('refuses when status is %s', (status) => {
    expect(() => makeAppointment({ status }).reschedule(newDate, '10:00', 1, NOW)).toThrow(AppointmentNotModifiableException);
  });
});

describe('AppointmentEntity – visit notes & details', () => {
  it('updates notes and reason before the visit', () => {
    const a = makeAppointment();
    a.updateDetails({ reasonForVisit: ' Follow up ', notes: 'Bring lab results' });
    expect(a.reasonForVisit).toBe('Follow up');
    expect(a.notes).toBe('Bring lab results');
  });

  it('requires at least one field', () => {
    expect(() => makeAppointment().updateDetails({})).toThrow(InvalidAppointmentDetailsException);
  });

  it('lets the doctor add notes during and after the visit, but not change the reason', () => {
    for (const status of [S.IN_PROGRESS, S.COMPLETED]) {
      const a = makeAppointment({ status });
      a.updateDetails({ notes: 'BP 120/80' });
      expect(a.notes).toBe('BP 120/80');
      expect(() => a.updateDetails({ reasonForVisit: 'new reason' })).toThrow(AppointmentNotModifiableException);
    }
  });

  it.each([S.CANCELLED, S.NO_SHOW])('refuses any edit when %s', (status) => {
    expect(() => makeAppointment({ status }).updateDetails({ notes: 'x' })).toThrow(AppointmentNotModifiableException);
  });
});

describe('AppointmentEntity – soft delete', () => {
  it('cancels an active appointment first, then marks it deleted', () => {
    const a = makeAppointment({ status: S.CONFIRMED });
    a.softDelete('usr_1', NOW, 'Booked by mistake');
    expect(a.status).toBe(S.CANCELLED);
    expect(a.cancellationReason).toBe('Booked by mistake');
    expect(a.isDeleted).toBe(true);
    expect(a.deletedAt).toEqual(NOW);
    expect(a.deletedBy).toBe('usr_1');
  });

  it('keeps the original cancellation when deleting an already-cancelled appointment', () => {
    const a = makeAppointment();
    a.cancel('patient request', 'usr_2');
    a.softDelete('usr_1', NOW);
    expect(a.cancellationReason).toBe('patient request');
    expect(a.isDeleted).toBe(true);
  });

  it.each([S.IN_PROGRESS, S.COMPLETED])('protects clinical records (%s)', (status) => {
    expect(() => makeAppointment({ status }).softDelete('u', NOW)).toThrow(AppointmentNotModifiableException);
  });

  it('a deleted appointment accepts no further changes', () => {
    const a = makeAppointment();
    a.softDelete('u', NOW);
    expect(() => a.updateDetails({ notes: 'x' })).toThrow(AppointmentNotModifiableException);
    expect(() => a.changeStatus(S.CHECKED_IN)).toThrow(AppointmentNotModifiableException);
    expect(() => a.softDelete('u', NOW)).toThrow(AppointmentNotModifiableException);
  });
});
