import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AppointmentStatus } from '../../domain/enums/appointment-status.enum';
import { AppointmentType } from '../../domain/enums/appointment-type.enum';

export type AppointmentDocument = AppointmentSchemaClass & Document;

@Schema({ collection: 'appointments', timestamps: true })
export class AppointmentSchemaClass {
  @Prop({ type: String, index: true })
  bookingCode: string;

  @Prop({ required: true, index: true })
  patientId: string;

  @Prop({ required: true, index: true })
  doctorClinicId: string;

  @Prop({ required: true, index: true })
  scheduleId: string;

  @Prop({ required: true, type: Date })
  appointmentDate: Date;

  @Prop({ required: true, type: String })
  timeSlot: string; // e.g. "14:30"

  @Prop({ required: true, type: Number })
  queueNumber: number;

  @Prop({ required: true, type: String })
  estimatedEntryTime: string; // e.g. "14:30"

  @Prop({ required: true, type: Number })
  durationMinutes: number;

  @Prop({ required: true, enum: AppointmentStatus, default: AppointmentStatus.CONFIRMED, index: true })
  status: AppointmentStatus;

  @Prop({ required: true, enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type: AppointmentType;

  @Prop({ type: String })
  reasonForVisit?: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String })
  cancellationReason?: string;

  @Prop({ type: String })
  cancelledBy?: string;

  @Prop({ type: Number, default: 0 })
  fee: number;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  // Soft delete: a non-null deletedAt hides the record from every query.
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: String })
  deletedBy?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(AppointmentSchemaClass);

AppointmentSchema.pre('save', function (this: any) {
  if (!this.bookingCode && this._id) {
    this.bookingCode = `BOOK-${this._id.toString()}`;
  }
});

AppointmentSchema.index({ doctorClinicId: 1, appointmentDate: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1, appointmentDate: 1 });
