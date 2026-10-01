import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('booking');

  const config = new DocumentBuilder()
    .setTitle('Booking Service API')
    .setDescription('Microservice API for Appointment Booking, Doctor Working Schedules, Slots Calculation, and Leave Exceptions.')
    .setVersion('1.0')
    .addTag('Appointments', 'Booking, Rescheduling, Cancellations, and Agenda Status')
    .addTag('Schedules', 'Doctor Working Hours, Slot Generator, and Vacation Exceptions')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`Booking Service is running on port ${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/booking/docs`);
  console.log(`Alternative Swagger url: http://localhost:${port}/docs`);
}
bootstrap();
