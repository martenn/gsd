// Import Express type augmentations first (adds id and user properties to Request)
import '../types/express';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../../logger/app-logger';
import { ErrorResponse, ValidationErrorResponse, HttpExceptionResponse } from '@gsd/types';
import { Prisma } from '@prisma/client';
import type { JwtUser } from '../../auth/dto/jwt-user.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HttpExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    try {
      const { status, message, error } = this.extractErrorInfo(exception);

      const errorResponse: ErrorResponse = {
        statusCode: status,
        message,
        error,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.id,
      };

      this.logError(exception, status, request);

      if (exception instanceof HttpException) {
        const httpException: HttpException = exception;
        if (this.isValidationError(httpException)) {
          const validationResponse = this.buildValidationErrorResponse(
            httpException,
            errorResponse,
          );
          response.status(status).json(validationResponse);
          return;
        }
      }

      response.status(status).json(errorResponse);
    } catch (filterError) {
      const errorMessage = filterError instanceof Error ? filterError.stack : String(filterError);
      this.logger.error('Error in exception filter', errorMessage);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }

  private extractErrorInfo(exception: unknown): {
    status: number;
    message: string;
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          status,
          message: response,
          error: this.getHttpStatusText(status),
        };
      }

      const responseObj = response as HttpExceptionResponse;
      const message =
        typeof responseObj.message === 'string'
          ? responseObj.message
          : Array.isArray(responseObj.message)
            ? responseObj.message.join(', ')
            : exception.message || 'An error occurred';

      return {
        status,
        message,
        error: responseObj.error || this.getHttpStatusText(status),
      };
    }

    if (this.isPrismaError(exception)) {
      return this.mapPrismaErrorToHttp(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        process.env.NODE_ENV === 'development' && exception instanceof Error
          ? exception.message
          : 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private isPrismaError(exception: unknown): exception is Prisma.PrismaClientKnownRequestError {
    return exception instanceof Prisma.PrismaClientKnownRequestError;
  }

  private mapPrismaErrorToHttp(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } {
    switch (error.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference',
          error: 'Bad Request',
        };
      case 'P2023':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid input',
          error: 'Bad Request',
        };
      case 'P1001':
      case 'P1002':
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Service temporarily unavailable',
          error: 'Service Unavailable',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Internal Server Error',
        };
    }
  }

  private isValidationError(exception: HttpException): boolean {
    const response = exception.getResponse();
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const responseObj = response as HttpExceptionResponse;
    return Array.isArray(responseObj.message);
  }

  private buildValidationErrorResponse(
    exception: HttpException,
    baseResponse: ErrorResponse,
  ): ValidationErrorResponse {
    const response = exception.getResponse() as HttpExceptionResponse;
    const messages = response.message;

    if (!messages) {
      return {
        ...baseResponse,
        message: 'Validation failed',
        errors: [],
      };
    }

    const validationMessages: string[] = Array.isArray(messages) ? messages : [messages];

    const errors = validationMessages.map((msg: string) => {
      const parts = msg.split(' ');
      const field = parts[0] || 'unknown';
      return {
        field,
        constraints: [msg],
      };
    });

    return {
      ...baseResponse,
      message: 'Validation failed',
      errors,
    };
  }

  private logError(exception: unknown, status: number, request: Request): void {
    const errorInfo = {
      status,
      method: request.method,
      path: request.url,
      requestId: request.id,
      userId: (request.user as unknown as JwtUser | undefined)?.id || 'anonymous',
    };

    if (status >= 500) {
      const stackTrace = exception instanceof Error ? exception.stack : JSON.stringify(exception);
      this.logger.error(`Internal server error: ${JSON.stringify(errorInfo)}`, stackTrace);
    } else if (status >= 400) {
      const errorMessage = exception instanceof Error ? exception.message : 'Unknown error';
      this.logger.warn(`Client error: ${JSON.stringify(errorInfo)} - ${errorMessage}`);
    }
  }

  private getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };

    return statusTexts[status] || 'Error';
  }
}
