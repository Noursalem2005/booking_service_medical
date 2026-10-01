import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScheduleExceptionEntity } from '../../domain/entities/schedule-exception.entity';
import { IScheduleExceptionRepository } from '../../domain/repositories/schedule-exception.repository';
import { ScheduleExceptionDocument, ScheduleExceptionSchemaClass } from '../schemas/schedule-exception.schema';

@Injectable()
export class MongoScheduleExceptionRepository implements IScheduleExceptionRepository {
  constructor(
    @InjectModel(ScheduleExceptionSchemaClass.name)
    private readonly exceptionModel: Model<ScheduleExceptionDocument>,
  ) {}

  private mapToEntity(doc: ScheduleExceptionDocument): ScheduleExceptionEntity {
    return new ScheduleExceptionEntity(
      doc._id.toString(),
      doc.doctorId,
      doc.clinicId,
      doc.startDate,
      doc.endDate,
      doc.type,
      doc.reason,
      (doc as any).createdAt,
      (doc as any).updatedAt,
    );
  }

  async create(data: Partial<ScheduleExceptionEntity>): Promise<ScheduleExceptionEntity> {
    const created = await this.exceptionModel.create(data);
    return this.mapToEntity(created);
  }

  async findByDoctorAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<ScheduleExceptionEntity[]> {
    const docs = await this.exceptionModel
      .find({
        doctorId,
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      })
      .exec();

    return docs.map((doc) => this.mapToEntity(doc));
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.exceptionModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
