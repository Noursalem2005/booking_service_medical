import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SetDoctorScheduleUseCase } from '../application/use-cases/set-doctor-schedule.use-case';
import { GetAvailableSlotsUseCase } from '../application/use-cases/get-available-slots.use-case';
import { AddScheduleExceptionUseCase } from '../application/use-cases/add-schedule-exception.use-case';

import { SetScheduleDto } from '../application/dto/set-schedule.dto';
import { AddScheduleExceptionDto } from '../application/dto/add-schedule-exception.dto';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly setScheduleUseCase: SetDoctorScheduleUseCase,
    private readonly getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
    private readonly addExceptionUseCase: AddScheduleExceptionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Set or update doctor working schedule for a clinic' })
  @ApiResponse({ status: 201, description: 'Schedule updated successfully' })
  async setSchedule(@Body() dto: SetScheduleDto) {
    return this.setScheduleUseCase.execute(dto);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor-clinic on a specific date' })
  @ApiResponse({ status: 200, description: 'List of calculated time slots' })
  async getAvailableSlots(
    @Query('doctorClinicId') doctorClinicId: string,
    @Query('date') date: string,
  ) {
    return this.getAvailableSlotsUseCase.execute(doctorClinicId, date);
  }

  @Post('exceptions')
  @ApiOperation({ summary: 'Add a leave / vacation exception to block availability' })
  @ApiResponse({ status: 201, description: 'Schedule exception created' })
  async addException(@Body() dto: AddScheduleExceptionDto) {
    return this.addExceptionUseCase.execute(dto);
  }
}
