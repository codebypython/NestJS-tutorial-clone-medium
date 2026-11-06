import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

function formatValidationErrors(errors: ValidationError[]): UnprocessableEntityException {
  const formattedErrors: Record<string, string[]> = {};
  for (const err of errors) {
    if (err.constraints) {
      formattedErrors[err.property] = Object.values(err.constraints);
    }
  }
  return new UnprocessableEntityException({
    errors: formattedErrors,
  });
}

@Injectable()
export class ConduitValidationPipe extends NestValidationPipe implements PipeTransform {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: formatValidationErrors,
    });
  }

  override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    return super.transform(value, metadata);
  }
}
