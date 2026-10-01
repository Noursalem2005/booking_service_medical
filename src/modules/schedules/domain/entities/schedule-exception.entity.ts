import { ExceptionType } from '../enums/exception-type.enum';

export class ScheduleExceptionEntity {
  constructor(
    public readonly id: string,
    public readonly doctorId: string,
    public readonly clinicId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly type: ExceptionType,
    public readonly reason?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
