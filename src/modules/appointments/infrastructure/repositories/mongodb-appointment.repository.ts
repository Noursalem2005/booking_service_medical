import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import {
  AppointmentSearchCriteria,
  IAppointmentRepository,
} from '../../domain/repositories/appointment.repository';
import { AppointmentDocument, AppointmentSchemaClass } from '../schemas/appointment.schema';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentNotFoundException } from '../../domain/exceptions/appointment.exceptions';
import { PaginatedResult, toPaginatedResult } from '../../../../core/domain/pagination';
import { endOfUtcDay, startOfUtcDay } from '../../../../core/domain/time.util';

/** `deletedAt: null` matches both "field is null" and "field does not exist" (pre-existing documents). */
const NOT_DELETED = { deletedAt: null };

@Injectable()
export class MongoAppointmentRepository implements IAppointmentRepository {
  constructor(
    @InjectModel(AppointmentSchemaClass.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  private mapToEntity(doc: AppointmentDocument): AppointmentEntity {
    return new AppointmentEntity(
      doc._id.toString(),
      doc.bookingCode || `BOOK-${doc._id.toString()}`,
      doc.patientId,
      doc.doctorClinicId,
      doc.scheduleId,
      doc.appointmentDate,
      doc.timeSlot,
      doc.queueNumber,
      doc.estimatedEntryTime,
      doc.durationMinutes,
      doc.status,
      doc.type,
      doc.reasonForVisit,
      doc.notes,
      doc.cancellationReason,
      doc.cancelledBy,
      doc.fee,
      doc.isPaid,
      (doc as any).createdAt,
      (doc as any).updatedAt,
      doc.deletedAt ?? undefined,
      doc.deletedBy,
    );
  }

  async create(data: Partial<AppointmentEntity>): Promise<AppointmentEntity> {
    const created = await this.appointmentModel.create(data);
    return this.mapToEntity(created);
  }

  /** Writes back only the state that domain methods are allowed to change. */
  async save(appointment: AppointmentEntity): Promise<AppointmentEntity> {
    const updated = await this.appointmentModel
      .findByIdAndUpdate(
        appointment.id,
        {
          $set: {
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot,
            queueNumber: appointment.queueNumber,
            estimatedEntryTime: appointment.estimatedEntryTime,
            status: appointment.status,
            type: appointment.type,
            reasonForVisit: appointment.reasonForVisit,
            notes: appointment.notes,
            cancellationReason: appointment.cancellationReason,
            cancelledBy: appointment.cancelledBy,
            fee: appointment.fee,
            isPaid: appointment.isPaid,
            deletedAt: appointment.deletedAt ?? null,
            deletedBy: appointment.deletedBy,
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new AppointmentNotFoundException(appointment.id);
    }
    return this.mapToEntity(updated);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await this.appointmentModel.findOne({ _id: id, ...NOT_DELETED }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByPatientId(patientId: string): Promise<AppointmentEntity[]> {
    const docs = await this.appointmentModel
      .find({ patientId, ...NOT_DELETED })
      .sort({ appointmentDate: -1 })
      .exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByDoctorClinic(doctorClinicId: string, startDate?: Date, endDate?: Date): Promise<AppointmentEntity[]> {
    const query: Record<string, any> = { doctorClinicId, ...NOT_DELETED };
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = startDate;
      if (endDate) query.appointmentDate.$lte = endDate;
    }
    const docs = await this.appointmentModel.find(query).sort({ appointmentDate: 1, queueNumber: 1 }).exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async search(criteria: AppointmentSearchCriteria): Promise<PaginatedResult<AppointmentEntity>> {
    const filter: Record<string, any> = { ...NOT_DELETED };

    if (criteria.patientId) filter.patientId = criteria.patientId;
    if (criteria.doctorClinicId) filter.doctorClinicId = criteria.doctorClinicId;
    if (criteria.statuses?.length) filter.status = { $in: criteria.statuses };
    if (criteria.dateFrom || criteria.dateTo) {
      filter.appointmentDate = {};
      if (criteria.dateFrom) filter.appointmentDate.$gte = criteria.dateFrom;
      if (criteria.dateTo) filter.appointmentDate.$lte = criteria.dateTo;
    }

    const direction = criteria.sortOrder === 'desc' ? -1 : 1;
    const [docs, total] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .sort({ appointmentDate: direction, timeSlot: direction, queueNumber: direction })
        .skip((criteria.page - 1) * criteria.limit)
        .limit(criteria.limit)
        .exec(),
      this.appointmentModel.countDocuments(filter).exec(),
    ]);

    return toPaginatedResult(
      docs.map((doc) => this.mapToEntity(doc)),
      total,
      criteria.page,
      criteria.limit,
    );
  }

  async getNextQueueNumber(doctorClinicId: string, appointmentDate: Date): Promise<number> {
    // Highest number ever issued that day (cancelled included) so a number is never handed out twice.
    const last = await this.appointmentModel
      .findOne({
        doctorClinicId,
        appointmentDate: { $gte: startOfUtcDay(appointmentDate), $lte: endOfUtcDay(appointmentDate) },
      })
      .sort({ queueNumber: -1 })
      .select('queueNumber')
      .exec();

    return (last?.queueNumber ?? 0) + 1;
  }

  async findOverlappingAppointments(
    doctorClinicId: string,
    appointmentDate: Date,
    timeSlot: string,
  ): Promise<AppointmentEntity[]> {
    const docs = await this.appointmentModel
      .find({
        doctorClinicId,
        appointmentDate: { $gte: startOfUtcDay(appointmentDate), $lte: endOfUtcDay(appointmentDate) },
        timeSlot,
        status: { $ne: AppointmentStatus.CANCELLED },
        ...NOT_DELETED,
      })
      .exec();

    return docs.map((doc) => this.mapToEntity(doc));
  }
}
