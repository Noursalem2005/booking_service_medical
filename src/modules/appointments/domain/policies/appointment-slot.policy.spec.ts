import { AppointmentSlotPolicy } from './appointment-slot.policy';
import { InvalidAppointmentSlotException } from '../exceptions/appointment.exceptions';
import { NOW } from '../../../../../test/support/fixed-clock';

describe('AppointmentSlotPolicy', () => {
  const today = new Date('2026-10-02T00:00:00.000Z'); // NOW is 09:00 UTC that day

  it('accepts a later slot today and any future day', () => {
    expect(() => AppointmentSlotPolicy.assertBookable(today, '09:30', NOW)).not.toThrow();
    expect(() => AppointmentSlotPolicy.assertBookable(new Date('2026-12-01'), '08:00', NOW)).not.toThrow();
  });

  it('rejects yesterday, an earlier slot today, and a slot starting right now', () => {
    expect(() => AppointmentSlotPolicy.assertBookable(new Date('2026-10-01'), '23:59', NOW)).toThrow(InvalidAppointmentSlotException);
    expect(() => AppointmentSlotPolicy.assertBookable(today, '08:59', NOW)).toThrow(InvalidAppointmentSlotException);
    expect(() => AppointmentSlotPolicy.assertBookable(today, '09:00', NOW)).toThrow(InvalidAppointmentSlotException);
  });

  it.each(['9:30', '24:00', '12:60', 'noon', ''])('rejects malformed slot "%s"', (slot) => {
    expect(() => AppointmentSlotPolicy.assertBookable(new Date('2026-12-01'), slot, NOW)).toThrow(InvalidAppointmentSlotException);
  });

  it('rejects an invalid date', () => {
    expect(() => AppointmentSlotPolicy.assertBookable(new Date('nope'), '10:00', NOW)).toThrow(InvalidAppointmentSlotException);
  });
});
