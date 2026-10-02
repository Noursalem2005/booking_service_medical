import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IssuePrescriptionUseCase } from '../application/use-cases/issue-prescription.use-case';
import { GetPrescriptionUseCase } from '../application/use-cases/get-prescription.use-case';
import { SearchPrescriptionsUseCase } from '../application/use-cases/search-prescriptions.use-case';
import { CancelPrescriptionUseCase } from '../application/use-cases/cancel-prescription.use-case';
import { IssuePrescriptionDto } from '../application/dto/issue-prescription.dto';
import { CancelPrescriptionDto } from '../application/dto/cancel-prescription.dto';
import {
  PatientPrescriptionHistoryQueryDto,
  SearchPrescriptionsQueryDto,
} from '../application/dto/search-prescriptions-query.dto';

@ApiTags('Prescriptions')
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private readonly issuePrescriptionUseCase: IssuePrescriptionUseCase,
    private readonly getPrescriptionUseCase: GetPrescriptionUseCase,
    private readonly searchPrescriptionsUseCase: SearchPrescriptionsUseCase,
    private readonly cancelPrescriptionUseCase: CancelPrescriptionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Issue a prescription for an attended appointment' })
  @ApiResponse({ status: 201, description: 'Prescription issued' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Patient has not been checked in for this appointment' })
  async issue(@Body() dto: IssuePrescriptionDto) {
    return this.issuePrescriptionUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search prescriptions by patient, doctor, appointment, status and issue date (paginated, newest first)' })
  @ApiResponse({ status: 200, description: 'Paginated list of prescriptions' })
  async search(@Query() query: SearchPrescriptionsQueryDto) {
    return this.searchPrescriptionsUseCase.execute(query);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Prescription history of a patient (paginated, newest first)' })
  @ApiResponse({ status: 200, description: 'Paginated prescription history' })
  async getPatientHistory(
    @Param('patientId') patientId: string,
    @Query() query: PatientPrescriptionHistoryQueryDto,
  ) {
    return this.searchPrescriptionsUseCase.execute({ ...query, patientId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single prescription' })
  @ApiResponse({ status: 200, description: 'The prescription' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  async getOne(@Param('id') id: string) {
    return this.getPrescriptionUseCase.execute(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a prescription issued by mistake (content itself is immutable)' })
  @ApiResponse({ status: 200, description: 'Prescription cancelled' })
  @ApiResponse({ status: 409, description: 'Already cancelled' })
  async cancel(@Param('id') id: string, @Body() dto: CancelPrescriptionDto) {
    return this.cancelPrescriptionUseCase.execute(id, dto);
  }
}
