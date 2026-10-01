import { Inject, Injectable } from '@nestjs/common';
import { SCHEDULE_EXCEPTION_REPOSITORY } from '../../domain/repositories/schedule-exception.repository';
import type { IScheduleExceptionRepository } from '../../domain/repositories/schedule-exception.repository';
import { ScheduleExceptionEntity } from '../../domain/entities/schedule-exception.entity';
import { ExceptionType } from '../../domain/enums/exception-type.enum';
import { AddScheduleExceptionDto } from '../dto/add-schedule-exception.dto';

@Injectable()
export class AddScheduleExceptionUseCase {
  constructor(
    @Inject(SCHEDULE_EXCEPTION_REPOSITORY)
    private readonly exceptionRepository: IScheduleExceptionRepository,
  ) {}

  async execute(dto: AddScheduleExceptionDto): Promise<ScheduleExceptionEntity> {
    return this.exceptionRepository.create({
      doctorId: dto.doctorId,
      clinicId: dto.clinicId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      type: dto.type || ExceptionType.DAY_OFF,
      reason: dto.reason,
    });
  }
}
