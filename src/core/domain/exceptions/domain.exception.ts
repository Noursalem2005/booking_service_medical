export enum DomainErrorKind {
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
}

/**
 * Base class for every error raised by the domain / application layers.
 * It carries NO HTTP knowledge – the presentation layer maps `kind` to a status code
 * (see DomainExceptionFilter), so the inner layers stay framework-agnostic.
 */
export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly kind: DomainErrorKind,
    public readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input / invariant is malformed (maps to 400). */
export class DomainValidationException extends DomainException {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, DomainErrorKind.VALIDATION, code);
  }
}

/** Requested aggregate does not exist (maps to 404). */
export class DomainNotFoundException extends DomainException {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, DomainErrorKind.NOT_FOUND, code);
  }
}

/** Request is valid but conflicts with the current state / a business rule (maps to 409). */
export class DomainConflictException extends DomainException {
  constructor(message: string, code = 'CONFLICT') {
    super(message, DomainErrorKind.CONFLICT, code);
  }
}
