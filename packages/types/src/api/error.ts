/**
 * Response structure returned by NestJS HttpException.getResponse()
 * Matches the OpenAPI Error schema structure
 */
export interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  constraints: string[];
}
