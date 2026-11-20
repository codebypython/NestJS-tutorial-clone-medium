import { InternalServerErrorException, Logger } from '@nestjs/common';
import { rethrowAsPersistenceError } from './persistence-error.util';

describe('persistence-error.util', () => {
  it('should log structured error and throw InternalServerErrorException for Error instance', () => {
    const errorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {});
    const originalError = new Error('Database connection failed');

    expect(() =>
      rethrowAsPersistenceError(originalError, 'article creation', 'ArticlesRepository'),
    ).toThrow(InternalServerErrorException);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unhandled database error during article creation',
        explanation: 'Database operation failed during article creation',
        guidance: 'Verify database connectivity and schema health',
        errorName: 'Error',
        errorMessage: 'Database connection failed',
      }),
      'ArticlesRepository',
    );
    errorSpy.mockRestore();
  });

  it('should handle non-Error inputs gracefully', () => {
    const errorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {});

    expect(() => rethrowAsPersistenceError('String error message', 'tag save', 'TagsService')).toThrow(
      InternalServerErrorException,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unhandled database error during tag save',
        errorMessage: 'String error message',
      }),
      'TagsService',
    );
    errorSpy.mockRestore();
  });
});
