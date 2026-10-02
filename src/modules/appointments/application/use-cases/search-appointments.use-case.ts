import { Inject, Injectable } from '@nestjs/common';
import { APPOINTMENT_REPOSITORY } from '../../domain/repositories/appointment.repository';
import type { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { AppointmentEntity } from '../../domain/entities/appointment.entity';
import { InvalidAppointmentDetailsException } from '../../domain/exceptions/appointment.exceptions';
import { PaginatedResult } from '../../../../core/domain/pagination';
import { endOfUtcDay, startOfUtcDay } from '../../../../core/domain/time.util';
import { SearchAppointmentsQueryDto } from '../dto/search-appointments-query.dto';

@Injectable()
export class SearchAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: IAppointmentRepository,
  ) {}

  async execute(query: SearchAppointmentsQueryDto): Promise<PaginatedResult<AppointmentEntity>> {
    // Date filters are day-granular and inclusive on both ends.
    const dateFrom = query.dateFrom ? startOfUtcDay(new Date(query.dateFrom)) : undefined;
    const dateTo = query.dateTo ? endOfUtcDay(new Date(query.dateTo)) : undefined;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new InvalidAppointmentDetailsException('dateFrom must not be after dateTo.');
    }

    return this.appointmentRepository.search({
      patientId: query.patientId,
      doctorClinicId: query.doctorClinicId,
      statuses: query.status?.length ? query.status : undefined,
      dateFrom,
      dateTo,
      sortOrder: query.sortOrder,
      page: query.page,
      limit: query.limit,
    });
  }
}
