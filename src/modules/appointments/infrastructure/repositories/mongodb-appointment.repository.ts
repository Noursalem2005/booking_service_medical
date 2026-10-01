import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentDocument, AppointmentSchemaClass } from '../schemas/appointment.schema';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';

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
    );
  }

  async create(data: Partial<AppointmentEntity>): Promise<AppointmentEntity> {
    const created = await this.appointmentModel.create(data);
    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const doc = await this.appointmentModel.findById(id).exec();
    return doc ? this.mapToEntity(doc) : null;
  }

  async findByPatientId(patientId: string): Promise<AppointmentEntity[]> {
    const docs = await this.appointmentModel.find({ patientId }).sort({ appointmentDate: -1 }).exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async findByDoctorClinic(doctorClinicId: string, startDate?: Date, endDate?: Date): Promise<AppointmentEntity[]> {
    const query: any = { doctorClinicId };
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = startDate;
      if (endDate) query.appointmentDate.$lte = endDate;
    }
    const docs = await this.appointmentModel.find(query).sort({ appointmentDate: 1, queueNumber: 1 }).exec();
    return docs.map((doc) => this.mapToEntity(doc));
  }

  async countAppointmentsForDate(doctorClinicId: string, appointmentDate: Date): Promise<number> {
    const start = new Date(appointmentDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(appointmentDate);
    end.setUTCHours(23, 59, 59, 999);

    return this.appointmentModel.countDocuments({
      doctorClinicId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $ne: AppointmentStatus.CANCELLED },
    }).exec();
  }

  async findOverlappingAppointments(
    doctorClinicId: string,
    appointmentDate: Date,
    timeSlot: string,
  ): Promise<AppointmentEntity[]> {
    const start = new Date(appointmentDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(appointmentDate);
    end.setUTCHours(23, 59, 59, 999);

    const docs = await this.appointmentModel
      .find({
        doctorClinicId,
        appointmentDate: { $gte: start, $lte: end },
        timeSlot,
        status: { $ne: AppointmentStatus.CANCELLED },
      })
      .exec();

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async update(id: string, data: Partial<AppointmentEntity>): Promise<AppointmentEntity | null> {
    const updated = await this.appointmentModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    return updated ? this.mapToEntity(updated) : null;
  }
}
