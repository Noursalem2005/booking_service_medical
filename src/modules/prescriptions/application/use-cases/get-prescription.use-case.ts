import { Inject, Injectable } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from '../../domain/repositories/prescription.repository';
import type { IPrescriptionRepository } from '../../domain/repositories/prescription.repository';
import { PrescriptionEntity } from '../../domain/entities/prescription.entity';
import { PrescriptionNotFoundException } from '../../domain/exceptions/prescription.exceptions';

@Injectable()
export class GetPrescriptionUseCase {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: IPrescriptionRepository,
  ) {}

  async execute(id: string): Promise<PrescriptionEntity> {
    const prescription = await this.prescriptionRepository.findById(id);
    if (!prescription) {
      throw new PrescriptionNotFoundException(id);
    }
    return prescription;
  }
}
