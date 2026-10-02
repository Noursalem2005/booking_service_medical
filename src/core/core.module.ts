import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from './infrastructure/database/mongodb/mongodb.module';
import { CLOCK } from './application/clock.port';
import { SystemClock } from './infrastructure/system-clock';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/booking-service',
      }),
      inject: [ConfigService],
    }),
    MongodbModule,
  ],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [
    ConfigModule,
    MongooseModule,
    MongodbModule,
    CLOCK,
  ],
})
export class CoreModule {}
