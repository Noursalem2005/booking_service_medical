import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ExceptionType } from '../../domain/enums/exception-type.enum';

export type ScheduleExceptionDocument = ScheduleExceptionSchemaClass & Document;

@Schema({ collection: 'schedule_exceptions', timestamps: true })
export class ScheduleExceptionSchemaClass {
  @Prop({ required: true, index: true })
  doctorId: string;

  @Prop({ required: true, index: true })
  clinicId: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ required: true, enum: ExceptionType, default: ExceptionType.DAY_OFF })
  type: ExceptionType;

  @Prop({ type: String })
  reason?: string;
}

export const ScheduleExceptionSchema = SchemaFactory.createForClass(ScheduleExceptionSchemaClass);
ScheduleExceptionSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });
