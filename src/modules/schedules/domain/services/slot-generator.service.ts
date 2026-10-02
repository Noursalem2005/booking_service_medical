import { DoctorScheduleEntity } from '../entities/doctor-schedule.entity';
import { AppointmentEntity } from '../../../appointments/domain/entities/appointment.entity';
import { AppointmentStatus } from '../../../appointments/domain/enums/appointment-status.enum';
import { ScheduleExceptionEntity } from '../entities/schedule-exception.entity';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  timeSlotString: string;
  isAvailable: boolean;
}

export class SlotGeneratorService {
  public generateSlotsForDate(
    dateStr: string, // "YYYY-MM-DD"
    schedule: DoctorScheduleEntity | null,
    existingAppointments: AppointmentEntity[],
    exceptions: ScheduleExceptionEntity[] = [],
    now: Date = new Date(),
  ): TimeSlot[] {
    if (!schedule || !schedule.weeklySchedule) {
      return [];
    }

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // Check if doctor has a day off exception on this date
    const hasFullDayOff = exceptions.some(
      (exc) => exc.startDate <= endOfDay && exc.endDate >= startOfDay,
    );

    if (hasFullDayOff) {
      return [];
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon...

    const daySchedule = schedule.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.isWorkingDay || !daySchedule.shifts || daySchedule.shifts.length === 0) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const slotDurationMs = schedule.slotDurationMinutes * 60 * 1000;

    for (const shift of daySchedule.shifts) {
      const shiftStart = this.parseTimeOnDate(dateStr, shift.startTime);
      const shiftEnd = this.parseTimeOnDate(dateStr, shift.endTime);

      let currentSlotStart = shiftStart.getTime();

      while (currentSlotStart + slotDurationMs <= shiftEnd.getTime()) {
        const slotStartTime = new Date(currentSlotStart);
        const slotEndTime = new Date(currentSlotStart + slotDurationMs);
        const timeSlotString = slotStartTime.toISOString().substring(11, 16); // "HH:mm"

        // Check if inside break time
        const isInBreak = daySchedule.breaks?.some((breakShift) =>
          this.isOverlapping(
            slotStartTime,
            slotEndTime,
            this.parseTimeOnDate(dateStr, breakShift.startTime),
            this.parseTimeOnDate(dateStr, breakShift.endTime),
          ),
        );

        // A slot is taken by any appointment that has not been cancelled
        const isBooked = existingAppointments.some(
          (apt) => apt.timeSlot === timeSlotString && apt.status !== AppointmentStatus.CANCELLED,
        );

        // Slots that already started cannot be booked (mirrors the booking rule)
        const isPast = slotStartTime.getTime() <= now.getTime();

        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          timeSlotString,
          isAvailable: !isInBreak && !isBooked && !isPast,
        });

        currentSlotStart += slotDurationMs;
      }
    }

    return slots;
  }

  private parseTimeOnDate(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}:00.000Z`);
  }

  private isOverlapping(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB;
  }
}
