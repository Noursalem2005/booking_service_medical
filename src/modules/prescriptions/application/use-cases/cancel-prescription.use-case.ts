import { Inject, Injectable } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from '../../domain/repositories/prescription.repository';
import type { IPrescriptionRepository } from '../../domain/repositories/prescription.repository';
import { PrescriptionEntity } from '../../domain/entities/prescription.entity';
import { PrescriptionNotFoundException } from '../../domain/exceptions/prescription.exceptions';
import { CancelPrescriptionDto } from '../dto/cancel-prescription.dto';
import { CLOCK } from '../../../../core/application/clock.port';
import type { Clock } from '../../../../core/application/clock.port';

@Injectable()
export class CancelPrescriptionUseCase {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: IPrescriptionRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(id: string, dto: CancelPrescriptionDto): Promise<PrescriptionEntity> {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription) {
      throw new PrescriptionNotFoundException(id);
    }

    prescription.cancel(dto.reason, dto.cancelledBy, this.clock.now());

    return this.prescriptionRepository.save(prescription);
  }
}
