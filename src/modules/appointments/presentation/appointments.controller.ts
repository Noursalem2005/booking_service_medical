import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BookAppointmentUseCase } from '../application/use-cases/book-appointment.use-case';
import { GetPatientAppointmentsUseCase } from '../application/use-cases/get-patient-appointments.use-case';
import { GetDoctorAppointmentsUseCase } from '../application/use-cases/get-doctor-appointments.use-case';
import { CancelAppointmentUseCase } from '../application/use-cases/cancel-appointment.use-case';
import { RescheduleAppointmentUseCase } from '../application/use-cases/reschedule-appointment.use-case';
import { UpdateAppointmentStatusUseCase } from '../application/use-cases/update-appointment-status.use-case';
import { UpdateAppointmentUseCase } from '../application/use-cases/update-appointment.use-case';
import { DeleteAppointmentUseCase } from '../application/use-cases/delete-appointment.use-case';
import { GetAppointmentUseCase } from '../application/use-cases/get-appointment.use-case';
import { SearchAppointmentsUseCase } from '../application/use-cases/search-appointments.use-case';

import { BookAppointmentDto } from '../application/dto/book-appointment.dto';
import { CancelAppointmentDto } from '../application/dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from '../application/dto/reschedule-appointment.dto';
import { UpdateAppointmentStatusDto } from '../application/dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from '../application/dto/update-appointment.dto';
import { DeleteAppointmentDto } from '../application/dto/delete-appointment.dto';
import { SearchAppointmentsQueryDto } from '../application/dto/search-appointments-query.dto';

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
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly deleteAppointmentUseCase: DeleteAppointmentUseCase,
    private readonly getAppointmentUseCase: GetAppointmentUseCase,
    private readonly searchAppointmentsUseCase: SearchAppointmentsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Book a new appointment (slot must not be in the past or already booked)' })
  @ApiResponse({ status: 201, description: 'Appointment successfully booked' })
  @ApiResponse({ status: 400, description: 'Invalid or past slot' })
  @ApiResponse({ status: 409, description: 'Slot already booked' })
  async bookAppointment(@Body() dto: BookAppointmentDto) {
    return this.bookAppointmentUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search appointments by date range, status(es), patient and/or doctor-clinic (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of appointments' })
  async searchAppointments(@Query() query: SearchAppointmentsQueryDto) {
    return this.searchAppointmentsUseCase.execute(query);
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a single appointment' })
  @ApiResponse({ status: 200, description: 'The appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getAppointment(@Param('id') id: string) {
    return this.getAppointmentUseCase.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update visit notes and/or reason for visit' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  @ApiResponse({ status: 409, description: 'Appointment can no longer be edited' })
  async updateAppointment(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.updateAppointmentUseCase.execute(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an existing appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 409, description: 'Appointment cannot be cancelled from its current status' })
  async cancelAppointment(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.cancelAppointmentUseCase.execute(id, dto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule an appointment to a new time slot' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiResponse({ status: 409, description: 'New slot already booked or appointment not reschedulable' })
  async rescheduleAppointment(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.rescheduleAppointmentUseCase.execute(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment lifecycle status (Check-in, Start, Complete, No-Show)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 409, description: 'Illegal status transition' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.updateStatusUseCase.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete an appointment (cancels it first if still active)' })
  @ApiResponse({ status: 204, description: 'Appointment deleted' })
  @ApiResponse({ status: 409, description: 'In-progress / completed appointments cannot be deleted' })
  async deleteAppointment(@Param('id') id: string, @Body() dto: DeleteAppointmentDto): Promise<void> {
    await this.deleteAppointmentUseCase.execute(id, dto);
  }
}
