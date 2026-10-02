import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentSchemaClass, AppointmentSchema } from './infrastructure/schemas/appointment.schema';
import { APPOINTMENT_REPOSITORY } from './domain/repositories/appointment.repository';
import { MongoAppointmentRepository } from './infrastructure/repositories/mongodb-appointment.repository';
import { BookAppointmentUseCase } from './application/use-cases/book-appointment.use-case';
import { CancelAppointmentUseCase } from './application/use-cases/cancel-appointment.use-case';
import { GetDoctorAppointmentsUseCase } from './application/use-cases/get-doctor-appointments.use-case';
import { GetPatientAppointmentsUseCase } from './application/use-cases/get-patient-appointments.use-case';
import { RescheduleAppointmentUseCase } from './application/use-cases/reschedule-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from './application/use-cases/update-appointment-status.use-case';
import { UpdateAppointmentUseCase } from './application/use-cases/update-appointment.use-case';
import { DeleteAppointmentUseCase } from './application/use-cases/delete-appointment.use-case';
import { GetAppointmentUseCase } from './application/use-cases/get-appointment.use-case';
import { SearchAppointmentsUseCase } from './application/use-cases/search-appointments.use-case';
import { AppointmentsController } from './presentation/appointments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppointmentSchemaClass.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [
    { provide: APPOINTMENT_REPOSITORY, useClass: MongoAppointmentRepository },
    BookAppointmentUseCase,
    CancelAppointmentUseCase,
    GetDoctorAppointmentsUseCase,
    GetPatientAppointmentsUseCase,
    RescheduleAppointmentUseCase,
    UpdateAppointmentStatusUseCase,
    UpdateAppointmentUseCase,
    DeleteAppointmentUseCase,
    GetAppointmentUseCase,
    SearchAppointmentsUseCase,
  ],
  exports: [APPOINTMENT_REPOSITORY, BookAppointmentUseCase],
})
export class AppointmentsModule {}
