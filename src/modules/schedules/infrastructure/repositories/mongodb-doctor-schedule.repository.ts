import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorScheduleEntity } from '../../domain/entities/doctor-schedule.entity';
import { IDoctorScheduleRepository } from '../../domain/repositories/doctor-schedule.repository';
import { DoctorScheduleDocument, DoctorScheduleSchemaClass } from '../schemas/doctor-schedule.schema';

@Injectable()
export class MongoDoctorScheduleRepository implements IDoctorScheduleRepository {
  constructor(
    @InjectModel(DoctorScheduleSchemaClass.name)
    private readonly scheduleModel: Model<DoctorScheduleDocument>,
  ) {}

  private mapToEntity(doc: DoctorScheduleDocument): DoctorScheduleEntity {
    return new DoctorScheduleEntity(
      doc._id.toString(),
      doc.doctorClinicId,
      doc.slotDurationMinutes,
      doc.weeklySchedule,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async upsertSchedule(data: Partial<DoctorScheduleEntity>): Promise<DoctorScheduleEntity> {
    const updated = await this.scheduleModel
      .findOneAndUpdate(
        { doctorClinicId: data.doctorClinicId },
        { $set: data },
        { upsert: true, new: true },
      )
      .exec();

    return this.mapToEntity(updated);
  }

  async findByDoctorClinic(doctorClinicId: string): Promise<DoctorScheduleEntity | null> {
    const doc = await this.scheduleModel.findOne({ doctorClinicId }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }
}
