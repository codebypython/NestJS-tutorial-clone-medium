import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    const mockResponse = {
      status: mockStatus,
    };
    const mockRequest = {
      method: 'POST',
      url: '/api/test',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should map MulterError with LIMIT_FILE_SIZE to HTTP 413 Payload Too Large', () => {
    const multerError = new Error('File too large') as Error & {
      name: string;
      code: string;
    };
    multerError.name = 'MulterError';
    multerError.code = 'LIMIT_FILE_SIZE';

    filter.catch(multerError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(mockJson).toHaveBeenCalledWith({
      errors: { file: ['File too large'] },
    });
  });

  it('should map MulterError with non-size code to HTTP 422 Unprocessable Entity', () => {
    const multerError = new Error('Unexpected field') as Error & {
      name: string;
      code: string;
    };
    multerError.name = 'MulterError';
    multerError.code = 'LIMIT_UNEXPECTED_FILE';

    filter.catch(multerError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith({
      errors: { file: ['Unexpected field'] },
    });
  });

  it('should map HttpException with custom errors record properly', () => {
    const httpException = new HttpException(
      {
        errors: {
          username: ['has already been taken'],
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(httpException, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockJson).toHaveBeenCalledWith({
      errors: {
        username: ['has already been taken'],
      },
    });
  });

  it('should map generic Error to HTTP 500 Internal Server Error', () => {
    const genericError = new Error('Something broke unexpectedly');

    filter.catch(genericError, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      errors: {
        error: ['Something broke unexpectedly'],
      },
    });
  });
});
