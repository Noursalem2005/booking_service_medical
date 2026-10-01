import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookAppointmentUseCase } from '../application/use-cases/book-appointment.use-case';
import { GetPatientAppointmentsUseCase } from '../application/use-cases/get-patient-appointments.use-case';
import { GetDoctorAppointmentsUseCase } from '../application/use-cases/get-doctor-appointments.use-case';
import { CancelAppointmentUseCase } from '../application/use-cases/cancel-appointment.use-case';
import { RescheduleAppointmentUseCase } from '../application/use-cases/reschedule-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from '../application/use-cases/update-appointment-status.use-case';

import { BookAppointmentDto } from '../application/dto/book-appointment.dto';
import { CancelAppointmentDto } from '../application/dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '../application/dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from '../application/dto/update-appointment-status.dto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly bookAppointmentUseCase: BookAppointmentUseCase,
    private readonly getPatientAppointmentsUseCase: GetPatientAppointmentsUseCase,
    private readonly getDoctorAppointmentsUseCase: GetDoctorAppointmentsUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    private readonly updateStatusUseCase: UpdateAppointmentStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment successfully booked' })
  async bookAppointment(@Body() dto: BookAppointmentDto) {
    return this.bookAppointmentUseCase.execute(dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointments history for a patient' })
  @ApiResponse({ status: 200, description: 'List of patient appointments' })
  async getPatientAppointments(@Param('patientId') patientId: string) {
    return this.getPatientAppointmentsUseCase.execute(patientId);
  }

  @Get('doctor-clinic/:doctorClinicId')
  @ApiOperation({ summary: 'Get daily agenda or list of appointments for a doctor-clinic' })
  @ApiResponse({ status: 200, description: 'Doctor-clinic appointments list' })
  async getDoctorAppointments(
    @Param('doctorClinicId') doctorClinicId: string,
    @Query('date') date?: string,
  ) {
    return this.getDoctorAppointmentsUseCase.execute(doctorClinicId, date);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an existing appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  async cancelAppointment(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.cancelAppointmentUseCase.execute(id, dto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment to a new time slot' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  async rescheduleAppointment(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.rescheduleAppointmentUseCase.execute(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment lifecycle status (Check-in, Complete, No-Show)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.updateStatusUseCase.execute(id, dto);
  }
}
