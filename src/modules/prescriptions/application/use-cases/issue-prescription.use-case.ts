import { randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from '../../domain/repositories/prescription.repository';
import type { IPrescriptionRepository } from '../../domain/repositories/prescription.repository';
import { APPOINTMENT_LOOKUP } from '../../domain/ports/appointment-lookup.port';
import type { AppointmentLookupPort } from '../../domain/ports/appointment-lookup.port';
import { PrescriptionEntity } from '../../domain/entities/prescription.entity';
import {
  PrescriptionAppointmentNotFoundException,
  VisitNotAttendedException,
} from '../../domain/exceptions/prescription.exceptions';
import { IssuePrescriptionDto } from '../dto/issue-prescription.dto';
import { CLOCK } from '../../../../core/application/clock.port';
import type { Clock } from '../../../../core/application/clock.port';

@Injectable()
export class IssuePrescriptionUseCase {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: IPrescriptionRepository,
    @Inject(APPOINTMENT_LOOKUP)
    private readonly appointmentLookup: AppointmentLookupPort,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(dto: IssuePrescriptionDto): Promise<PrescriptionEntity> {
    const appointment = await this.appointmentLookup.findById(dto.appointmentId);
    if (!appointment) {
      throw new PrescriptionAppointmentNotFoundException(dto.appointmentId);
    }

    // Rule: you can only prescribe after the patient actually showed up.
    if (!appointment.patientAttended) {
      throw new VisitNotAttendedException(appointment.id);
    }

    const now = this.clock.now();

    // Patient and clinic come from the appointment, so they can never disagree with it.
    const prescription = PrescriptionEntity.issue({
      id: randomUUID(),
      prescriptionCode: this.generateCode(now),
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: dto.doctorId,
      doctorClinicId: appointment.doctorClinicId,
      items: dto.items,
      diagnosis: dto.diagnosis,
      notes: dto.notes,
      validityDays: dto.validityDays,
      issuedAt: now,
    });

    return this.prescriptionRepository.save(prescription);
  }

  /** Human-friendly reference, e.g. RX-20261002-A1B2C3. Uniqueness is enforced by a DB index. */
  private generateCode(now: Date): string {
    const day = now.toISOString().substring(0, 10).replace(/-/g, '');
    return `RX-${day}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }
}
