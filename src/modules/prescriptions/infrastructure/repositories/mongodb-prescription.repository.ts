import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrescriptionEntity } from '../../domain/entities/prescription.entity';
import { PrescriptionItem } from '../../domain/value-objects/prescription-item.vo';
import {
  IPrescriptionRepository,
  PrescriptionSearchCriteria,
} from '../../domain/repositories/prescription.repository';
import { PrescriptionDocument, PrescriptionSchemaClass } from '../schemas/prescription.schema';
import { PaginatedResult, toPaginatedResult } from '../../../../core/domain/pagination';

@Injectable()
export class MongoPrescriptionRepository implements IPrescriptionRepository {
  constructor(
    @InjectModel(PrescriptionSchemaClass.name)
    private readonly prescriptionModel: Model<PrescriptionDocument>,
  ) {}

  private mapToEntity(doc: PrescriptionDocument): PrescriptionEntity {
    return new PrescriptionEntity(
      String(doc._id),
      doc.prescriptionCode,
      doc.appointmentId,
      doc.patientId,
      doc.doctorId,
      doc.doctorClinicId,
      doc.items.map((item) =>
        PrescriptionItem.restore({
          medicationName: item.medicationName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          quantity: item.quantity,
          route: item.route,
          instructions: item.instructions,
        }),
      ),
      doc.issuedAt,
      doc.validUntil,
      doc.status,
      doc.diagnosis,
      doc.notes,
      doc.cancellationReason,
      doc.cancelledBy,
      doc.cancelledAt,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async save(prescription: PrescriptionEntity): Promise<PrescriptionEntity> {
    const saved = await this.prescriptionModel
      .findOneAndUpdate(
        { _id: prescription.id },
        {
          $set: {
            prescriptionCode: prescription.prescriptionCode,
            appointmentId: prescription.appointmentId,
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            doctorClinicId: prescription.doctorClinicId,
            items: prescription.items.map((item) => ({ ...item })),
            diagnosis: prescription.diagnosis,
            notes: prescription.notes,
            status: prescription.status,
            issuedAt: prescription.issuedAt,
            validUntil: prescription.validUntil,
            cancellationReason: prescription.cancellationReason,
            cancelledBy: prescription.cancelledBy,
            cancelledAt: prescription.cancelledAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return this.mapToEntity(saved);
  }

  async findById(id: string): Promise<PrescriptionEntity | null> {
    const doc = await this.prescriptionModel.findOne({ _id: id }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async search(criteria: PrescriptionSearchCriteria): Promise<PaginatedResult<PrescriptionEntity>> {
    const filter: Record<string, any> = {};

    if (criteria.patientId) filter.patientId = criteria.patientId;
    if (criteria.doctorId) filter.doctorId = criteria.doctorId;
    if (criteria.appointmentId) filter.appointmentId = criteria.appointmentId;
    if (criteria.status) filter.status = criteria.status;
    if (criteria.issuedFrom || criteria.issuedTo) {
      filter.issuedAt = {};
      if (criteria.issuedFrom) filter.issuedAt.$gte = criteria.issuedFrom;
      if (criteria.issuedTo) filter.issuedAt.$lte = criteria.issuedTo;
    }

    const [docs, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ issuedAt: -1, _id: -1 })
        .skip((criteria.page - 1) * criteria.limit)
        .limit(criteria.limit)
        .exec(),
      this.prescriptionModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      criteria.page,
      criteria.limit,
    );
  }
}
