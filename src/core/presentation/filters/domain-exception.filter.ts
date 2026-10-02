import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DomainErrorKind, DomainException } from '../../domain/exceptions/domain.exception';

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
  [DomainErrorKind.VALIDATION]: HttpStatus.BAD_REQUEST,
  [DomainErrorKind.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.CONFLICT]: HttpStatus.CONFLICT,
};

/** Translates domain errors into HTTP responses – the only place that knows the mapping. */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = STATUS_BY_KIND[exception.kind] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(statusCode).json({
      statusCode,
      error: exception.code,
      message: exception.message,
    });
  }
}
