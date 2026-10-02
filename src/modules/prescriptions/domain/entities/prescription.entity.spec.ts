import { IssuePrescriptionProps, PrescriptionEntity } from './prescription.entity';
import { PrescriptionStatus } from '../enums/prescription-status.enum';
import { InvalidPrescriptionException, PrescriptionNotModifiableException } from '../exceptions/prescription.exceptions';
import { NOW } from '../../../../../test/support/fixed-clock';

const item = { medicationName: ' Amoxicillin ', dosage: '500 mg', frequency: 'twice daily', durationDays: 7 };
const props = (over: Partial<IssuePrescriptionProps> = {}): IssuePrescriptionProps => ({
  id: 'rx_1',
  prescriptionCode: 'RX-20261002-AAAAAA',
  appointmentId: 'apt_1',
  patientId: 'pat_1',
  doctorId: 'doc_1',
  doctorClinicId: 'dc_1',
  items: [item],
  issuedAt: NOW,
  ...over,
});

describe('PrescriptionEntity', () => {
  describe('issue', () => {
    it('creates an ACTIVE prescription valid for 30 days by default, trimming input', () => {
      const rx = PrescriptionEntity.issue(props({ diagnosis: '  Sinusitis ' }));
      expect(rx.status).toBe(PrescriptionStatus.ACTIVE);
      expect(rx.items[0].medicationName).toBe('Amoxicillin');
      expect(rx.diagnosis).toBe('Sinusitis');
      expect(rx.validUntil.toISOString()).toBe('2026-11-01T09:00:00.000Z');
    });

    it('honours a custom validity', () => {
      const rx = PrescriptionEntity.issue(props({ validityDays: 7 }));
      expect(rx.validUntil.toISOString()).toBe('2026-10-09T09:00:00.000Z');
    });

    it('needs at least one medication and at most 20', () => {
      expect(() => PrescriptionEntity.issue(props({ items: [] }))).toThrow(InvalidPrescriptionException);
      expect(() => PrescriptionEntity.issue(props({ items: Array(21).fill(item) }))).toThrow(InvalidPrescriptionException);
      expect(() => PrescriptionEntity.issue(props({ items: Array(20).fill(item) }))).not.toThrow();
    });

    it('needs a doctor', () => {
      expect(() => PrescriptionEntity.issue(props({ doctorId: '  ' }))).toThrow(InvalidPrescriptionException);
    });

    it.each([0, -1, 366, 1.5])('rejects validity of %s days', (validityDays) => {
      expect(() => PrescriptionEntity.issue(props({ validityDays }))).toThrow(InvalidPrescriptionException);
    });

    it.each([
      ['blank medication', { medicationName: ' ' }],
      ['blank dosage', { dosage: '' }],
      ['blank frequency', { frequency: ' ' }],
      ['zero duration', { durationDays: 0 }],
      ['fractional duration', { durationDays: 2.5 }],
      ['duration > 365', { durationDays: 366 }],
      ['zero quantity', { quantity: 0 }],
    ])('rejects an item with %s', (_label, bad) => {
      expect(() => PrescriptionEntity.issue(props({ items: [{ ...item, ...bad }] }))).toThrow(InvalidPrescriptionException);
    });
  });

  describe('expiry', () => {
    it('is derived from the clock', () => {
      const rx = PrescriptionEntity.issue(props({ validityDays: 1 }));
      expect(rx.isExpired(new Date('2026-10-03T08:59:59.000Z'))).toBe(false);
      expect(rx.isExpired(new Date('2026-10-03T09:00:01.000Z'))).toBe(true);
    });
  });

  describe('cancel', () => {
    it('cancels once, recording who/why/when', () => {
      const rx = PrescriptionEntity.issue(props());
      rx.cancel(' wrong patient ', 'doc_1', NOW);
      expect(rx.status).toBe(PrescriptionStatus.CANCELLED);
      expect(rx.cancellationReason).toBe('wrong patient');
      expect(rx.cancelledAt).toEqual(NOW);
      expect(() => rx.cancel('again', 'doc_1', NOW)).toThrow(PrescriptionNotModifiableException);
    });

    it('requires a reason and a canceller', () => {
      const rx = PrescriptionEntity.issue(props());
      expect(() => rx.cancel(' ', 'doc_1', NOW)).toThrow(InvalidPrescriptionException);
      expect(() => rx.cancel('why', ' ', NOW)).toThrow(InvalidPrescriptionException);
      expect(rx.status).toBe(PrescriptionStatus.ACTIVE);
    });
  });
});
