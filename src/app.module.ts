import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';

@Module({
  imports: [
    CoreModule,
    AppointmentsModule,
    SchedulesModule,
    PrescriptionsModule,
  ],
})
export class AppModule {}
