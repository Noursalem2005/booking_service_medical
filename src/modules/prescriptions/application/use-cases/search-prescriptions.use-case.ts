import { Inject, Injectable } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from '../../domain/repositories/prescription.repository';
import type { IPrescriptionRepository } from '../../domain/repositories/prescription.repository';
import { PrescriptionEntity } from '../../domain/entities/prescription.entity';
import { PrescriptionStatus } from '../../domain/enums/prescription-status.enum';
import { InvalidPrescriptionException } from '../../domain/exceptions/prescription.exceptions';
import { PaginatedResult } from '../../../../core/domain/pagination';
import { endOfUtcDay, startOfUtcDay } from '../../../../core/domain/time.util';

export interface SearchPrescriptionsInput {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: PrescriptionStatus;
  issuedFrom?: string;
  issuedTo?: string;
  page: number;
  limit: number;
}

/** Powers both the generic search and the patient's prescription history. */
@Injectable()
export class SearchPrescriptionsUseCase {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: IPrescriptionRepository,
  ) {}

  async execute(input: SearchPrescriptionsInput): Promise<PaginatedResult<PrescriptionEntity>> {
    const issuedFrom = input.issuedFrom ? startOfUtcDay(new Date(input.issuedFrom)) : undefined;
    const issuedTo = input.issuedTo ? endOfUtcDay(new Date(input.issuedTo)) : undefined;

    if (issuedFrom && issuedTo && issuedFrom > issuedTo) {
      throw new InvalidPrescriptionException('issuedFrom must not be after issuedTo.');
    }

    return this.prescriptionRepository.search({
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentId: input.appointmentId,
      status: input.status,
      issuedFrom,
      issuedTo,
      page: input.page,
      limit: input.limit,
    });
  }
}
