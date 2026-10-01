import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DoctorScheduleDocument = DoctorScheduleSchemaClass & Document;

@Schema({ _id: false })
export class TimeShiftSchema {
  @Prop({ required: true })
  startTime: string; // "09:00"

  @Prop({ required: true })
  endTime: string;   // "17:00"
}

@Schema({ _id: false })
export class DayScheduleSchema {
  @Prop({ required: true, type: Number })
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @Prop({ default: true, type: Boolean })
  isWorkingDay: boolean;

  @Prop({ type: [TimeShiftSchema], default: [] })
  shifts: TimeShiftSchema[];

  @Prop({ type: [TimeShiftSchema], default: [] })
  breaks: TimeShiftSchema[];

  @Prop({ type: Number })
  avgTimeMinutes?: number;

  @Prop({ type: Number })
  maxPatients?: number;
}

@Schema({ collection: 'doctor_schedules', timestamps: true })
export class DoctorScheduleSchemaClass {
  @Prop({ required: true, unique: true, index: true })
  doctorClinicId: string;

  @Prop({ required: true, type: Number, default: 30 })
  slotDurationMinutes: number;

  @Prop({ type: [DayScheduleSchema], default: [] })
  weeklySchedule: DayScheduleSchema[];
}

export const DoctorScheduleSchema = SchemaFactory.createForClass(DoctorScheduleSchemaClass);
