import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AppLogger } from './app-logger';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(`${method} ${url} - ${userAgent}`);

    if (Object.keys(body).length > 0) {
      this.logger.debug(`Request body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;
          this.logger.log(`${method} ${url} ${statusCode} - ${responseTime}ms`);
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${error.status || 500} - ${responseTime}ms - ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
