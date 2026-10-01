import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from './infrastructure/database/mongodb/mongodb.module';

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
  exports: [
    ConfigModule,
    MongooseModule,
    MongodbModule,
  ],
})
export class CoreModule {}
