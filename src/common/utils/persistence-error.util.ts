import { InternalServerErrorException, Logger } from '@nestjs/common';

export function rethrowAsPersistenceError(
  err: unknown,
  operation: string,
  context: string,
): never {
  const fatalError = err instanceof Error ? err : new Error(String(err));
  Logger.error(
    {
      message: `Unhandled database error during ${operation}`,
      explanation: `Database operation failed during ${operation}`,
      guidance: 'Verify database connectivity and schema health',
      errorName: fatalError.name,
      errorMessage: fatalError.message,
      rawError: fatalError,
    },
    context,
  );
  throw new InternalServerErrorException({
    message: 'Database persistence failed due to an internal server error',
    explanation: `The system encountered an unhandled error during ${operation}`,
    guidance: 'Check database connectivity and server logs',
  });
}
