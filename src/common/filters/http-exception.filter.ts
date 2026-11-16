import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export const MULTER_LIMIT_FILE_SIZE = 'LIMIT_FILE_SIZE';

interface ConduitErrorResponse {
  errors: Record<string, string[]>;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
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
    } else if (
      exception instanceof Error &&
      exception.name === 'MulterError'
    ) {
      const multerErr = exception as { code?: string; message: string };
      if (multerErr.code === MULTER_LIMIT_FILE_SIZE) {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
      } else {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
      }
      errorBody = { file: [exception.message] };
    } else if (exception instanceof Error) {
      Logger.error(`Unhandled Exception: ${exception.message}`, exception.stack, 'AllExceptionsFilter');
      errorBody = { error: [exception.message] };
    }

    const output: ConduitErrorResponse = {
      errors: errorBody,
    };

    const safeMethod = String(request.method).replace(/[\r\n]/g, '');
    const safeUrl = String(request.url)
      .replace(/[\r\n]/g, '')
      .slice(0, 100);
    Logger.warn(`HTTP exception handled: ${safeMethod} ${safeUrl} with status ${status}`, 'AllExceptionsFilter');

    response.status(status).json(output);
  }
}
