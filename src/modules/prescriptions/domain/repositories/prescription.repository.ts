import { PaginatedResult } from '../../../../core/domain/pagination';
import { PrescriptionEntity } from '../entities/prescription.entity';
import { PrescriptionStatus } from '../enums/prescription-status.enum';

export interface PrescriptionSearchCriteria {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: PrescriptionStatus;
  /** Inclusive bounds on issuedAt. */
  issuedFrom?: Date;
  issuedTo?: Date;
  page: number;
  limit: number;
}

export interface IPrescriptionRepository {
  /** Inserts a new prescription or persists changes to an existing one (matched by id). */
  save(prescription: PrescriptionEntity): Promise<PrescriptionEntity>;
  findById(id: string): Promise<PrescriptionEntity | null>;
  /** Newest first. */
  search(criteria: PrescriptionSearchCriteria): Promise<PaginatedResult<PrescriptionEntity>>;
}

export const PRESCRIPTION_REPOSITORY = Symbol('IPrescriptionRepository');
