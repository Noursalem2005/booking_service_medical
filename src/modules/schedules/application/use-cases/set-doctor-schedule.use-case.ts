import { Inject, Injectable } from '@nestjs/common';
import { DOCTOR_SCHEDULE_REPOSITORY } from '../../domain/repositories/doctor-schedule.repository';
import type { IDoctorScheduleRepository } from '../../domain/repositories/doctor-schedule.repository';
import { DoctorScheduleEntity } from '../../domain/entities/doctor-schedule.entity';
import { SetScheduleDto } from '../dto/set-schedule.dto';

@Injectable()
export class SetDoctorScheduleUseCase {
  constructor(
    @Inject(DOCTOR_SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: IDoctorScheduleRepository,
  ) {}

  async execute(dto: SetScheduleDto): Promise<DoctorScheduleEntity> {
    return this.scheduleRepository.upsertSchedule(dto);
  }
}
