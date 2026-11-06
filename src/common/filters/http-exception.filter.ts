import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ConduitErrorResponse {
  errors: Record<string, string[]>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorBody: Record<string, string[]> = {
      database: ['Internal server error occurred'],
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        errorBody = { message: [res] };
      } else if (typeof res === 'object' && res !== null) {
        const payload = res as Record<string, unknown>;
        if (Array.isArray(payload.message)) {
          errorBody = { body: payload.message as string[] };
        } else if (typeof payload.message === 'string') {
          errorBody = { message: [payload.message] };
        } else if (payload.errors && typeof payload.errors === 'object') {
          errorBody = payload.errors as Record<string, string[]>;
        } else {
          errorBody = { message: [exception.message] };
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      errorBody = { error: [exception.message] };
    }

    const output: ConduitErrorResponse = {
      errors: errorBody,
    };

    this.logger.warn(`[${request.method}] ${request.url} - Status: ${status}`);

    response.status(status).json(output);
  }
}
