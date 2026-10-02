import { SlotGeneratorService } from './slot-generator.service';
import { DoctorScheduleEntity } from '../entities/doctor-schedule.entity';
import { AppointmentStatus as S } from '../../../appointments/domain/enums/appointment-status.enum';
import { makeAppointment } from '../../../../../test/support/appointment.factory';
import { NOW } from '../../../../../test/support/fixed-clock';

// 2026-10-05 is a Monday (dayOfWeek = 1)
const schedule = new DoctorScheduleEntity('s1', 'dc_1', 60, [
  { dayOfWeek: 1, isWorkingDay: true, shifts: [{ startTime: '09:00', endTime: '12:00' }], breaks: [{ startTime: '10:00', endTime: '11:00' }] },
  { dayOfWeek: 5, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '11:00' }], breaks: [] }, // Fri = "today"
]);
const svc = new SlotGeneratorService();

describe('SlotGeneratorService', () => {
  it('marks breaks and active bookings unavailable', () => {
    const booked = makeAppointment({ timeSlot: '09:00', status: S.CONFIRMED });
    const slots = svc.generateSlotsForDate('2026-10-05', schedule, [booked], [], NOW);
    expect(slots.map((s) => [s.timeSlotString, s.isAvailable])).toEqual([
      ['09:00', false], // booked
      ['10:00', false], // break
      ['11:00', true],
    ]);
  });

  it('frees the slot of a CANCELLED appointment', () => {
    const cancelled = makeAppointment({ timeSlot: '09:00', status: S.CANCELLED });
    const slots = svc.generateSlotsForDate('2026-10-05', schedule, [cancelled], [], NOW);
    expect(slots[0]).toMatchObject({ timeSlotString: '09:00', isAvailable: true });
  });

  it('marks slots that have already started as unavailable (now = Fri 09:00)', () => {
    const slots = svc.generateSlotsForDate('2026-10-02', schedule, [], [], NOW);
    expect(slots.map((s) => [s.timeSlotString, s.isAvailable])).toEqual([
      ['08:00', false],
      ['09:00', false], // starts exactly now → not bookable
      ['10:00', true],
    ]);
  });
});
