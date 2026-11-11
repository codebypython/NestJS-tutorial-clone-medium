import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  PipeTransform,
  UnprocessableEntityException,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

function collectValidationErrors(
  errors: ValidationError[],
  target: Record<string, string[]> = {},
): Record<string, string[]> {
  for (const err of errors) {
    if (err.constraints) {
      target[err.property] = Object.values(err.constraints);
    }
    if (err.children && err.children.length > 0) {
      collectValidationErrors(err.children, target);
    }
  }
  return target;
}

function formatValidationErrors(errors: ValidationError[]): UnprocessableEntityException {
  const formattedErrors = collectValidationErrors(errors);
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
