import { HttpExceptionFilter } from './http-exception.filter';
import { AppLogger } from '../../logger/app-logger';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: AppLogger;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as unknown as AppLogger;

    filter = new HttpExceptionFilter(logger);

    mockRequest = {
      url: '/test-path',
      method: 'GET',
      id: 'test-request-id-123',
      user: { id: 'test-user-id' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HttpException handling', () => {
    it('should handle NotFoundException and return 404 response', () => {
      const exception = new NotFoundException('List not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'List not found',
          error: 'Not Found',
          path: '/test-path',
          requestId: 'test-request-id-123',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle BadRequestException and return 400 response', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid input',
          error: 'Bad Request',
        }),
      );
    });

    it('should handle UnauthorizedException and return 401 response', () => {
      const exception = new UnauthorizedException();

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          error: 'Unauthorized',
        }),
      );
    });

    it('should handle ConflictException and return 409 response', () => {
      const exception = new ConflictException('Resource already exists');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: 'Resource already exists',
          error: 'Conflict',
        }),
      );
    });
  });

  describe('Validation error handling', () => {
    it('should transform validation errors into ValidationErrorResponse', () => {
      const exception = new BadRequestException({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              constraints: expect.any(Array),
            }),
          ]),
        }),
      );
    });
  });

  describe('Prisma error handling', () => {
    it('should map Prisma P2002 to 409 Conflict', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
          message: 'Resource already exists',
          error: 'Conflict',
        }),
      );
    });

    it('should map Prisma P2025 to 404 Not Found', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
        }),
      );
    });

    it('should map Prisma P2003 to 400 Bad Request', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid reference',
          error: 'Bad Request',
        }),
      );
    });

    it('should map Prisma P1001 to 503 Service Unavailable', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Cannot reach database', {
        code: 'P1001',
        clientVersion: '5.0.0',
      });

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          message: 'Service temporarily unavailable',
          error: 'Service Unavailable',
        }),
      );
    });

    it('should map unknown Prisma errors to 500 Internal Server Error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      filter.catch(prismaError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        }),
      );
    });
  });

  describe('Generic error handling', () => {
    it('should handle generic Error and return 500 response in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Something went wrong');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include error message in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'Detailed error message',
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request ID correlation', () => {
    it('should include request ID in error response', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id-123',
        }),
      );
    });

    it('should handle missing request ID gracefully', () => {
      mockRequest.id = undefined;
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: undefined,
        }),
      );
    });
  });

  describe('Logging behavior', () => {
    it('should log 4xx errors with warn level', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Client error'));
    });

    it('should log 5xx errors with error level and stack trace', () => {
      const error = new Error('Internal error');

      filter.catch(error, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Internal server error'),
        expect.any(String),
      );
    });

    it('should include user ID in log context if available', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('test-user-id'));
    });

    it('should use "anonymous" when user is not authenticated', () => {
      mockRequest.user = undefined;
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('anonymous'));
    });
  });

  describe('Self-protecting error handling', () => {
    it('should handle errors in filter execution and return safe response', () => {
      const exception = new NotFoundException('Test');
      let callCount = 0;
      mockResponse.status = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Response error');
        }
        return mockResponse;
      });

      filter.catch(exception, mockArgumentsHost);

      expect(logger.error).toHaveBeenCalledWith('Error in exception filter', expect.any(String));
      expect(mockResponse.status).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal server error',
      });
    });
  });

  describe('Timestamp format', () => {
    it('should include ISO 8601 timestamp in error response', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
