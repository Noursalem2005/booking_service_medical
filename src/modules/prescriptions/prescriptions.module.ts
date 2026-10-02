import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PRESCRIPTION_REPOSITORY } from './domain/repositories/prescription.repository';
import { APPOINTMENT_LOOKUP } from './domain/ports/appointment-lookup.port';
import { PrescriptionSchema, PrescriptionSchemaClass } from './infrastructure/schemas/prescription.schema';
import { MongoPrescriptionRepository } from './infrastructure/repositories/mongodb-prescription.repository';
import { AppointmentsModuleLookupAdapter } from './infrastructure/adapters/appointments-module-lookup.adapter';
import { IssuePrescriptionUseCase } from './application/use-cases/issue-prescription.use-case';
import { GetPrescriptionUseCase } from './application/use-cases/get-prescription.use-case';
import { SearchPrescriptionsUseCase } from './application/use-cases/search-prescriptions.use-case';
import { CancelPrescriptionUseCase } from './application/use-cases/cancel-prescription.use-case';
import { PrescriptionsController } from './presentation/prescriptions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PrescriptionSchemaClass.name, schema: PrescriptionSchema }]),
    AppointmentsModule, // exports APPOINTMENT_REPOSITORY, used by the lookup adapter
  ],
  controllers: [PrescriptionsController],
  providers: [
    { provide: PRESCRIPTION_REPOSITORY, useClass: MongoPrescriptionRepository },
    { provide: APPOINTMENT_LOOKUP, useClass: AppointmentsModuleLookupAdapter },
    IssuePrescriptionUseCase,
    GetPrescriptionUseCase,
    SearchPrescriptionsUseCase,
    CancelPrescriptionUseCase,
  ],
  exports: [PRESCRIPTION_REPOSITORY],
})
export class PrescriptionsModule {}
