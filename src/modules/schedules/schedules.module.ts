import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorScheduleSchemaClass, DoctorScheduleSchema } from './infrastructure/schemas/doctor-schedule.schema';
import { ScheduleExceptionSchemaClass, ScheduleExceptionSchema } from './infrastructure/schemas/schedule-exception.schema';
import { DOCTOR_SCHEDULE_REPOSITORY } from './domain/repositories/doctor-schedule.repository';
import { SCHEDULE_EXCEPTION_REPOSITORY } from './domain/repositories/schedule-exception.repository';
import { MongoDoctorScheduleRepository } from './infrastructure/repositories/mongodb-doctor-schedule.repository';
import { MongoScheduleExceptionRepository } from './infrastructure/repositories/mongodb-schedule-exception.repository';
import { SlotGeneratorService } from './domain/services/slot-generator.service';
import { AddScheduleExceptionUseCase } from './application/use-cases/add-schedule-exception.use-case';
import { GetAvailableSlotsUseCase } from './application/use-cases/get-available-slots.use-case';
import { SetDoctorScheduleUseCase } from './application/use-cases/set-doctor-schedule.use-case';
import { SchedulesController } from './presentation/schedules.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorScheduleSchemaClass.name, schema: DoctorScheduleSchema },
      { name: ScheduleExceptionSchemaClass.name, schema: ScheduleExceptionSchema },
    ]),
    AppointmentsModule,
  ],
  controllers: [SchedulesController],
  providers: [
    { provide: DOCTOR_SCHEDULE_REPOSITORY, useClass: MongoDoctorScheduleRepository },
    { provide: SCHEDULE_EXCEPTION_REPOSITORY, useClass: MongoScheduleExceptionRepository },
    SlotGeneratorService,
    AddScheduleExceptionUseCase,
    GetAvailableSlotsUseCase,
    SetDoctorScheduleUseCase,
  ],
  exports: [
    DOCTOR_SCHEDULE_REPOSITORY,
    SCHEDULE_EXCEPTION_REPOSITORY,
    SlotGeneratorService,
  ],
})
export class SchedulesModule {}
