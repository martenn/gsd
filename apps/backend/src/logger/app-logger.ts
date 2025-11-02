import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  setContext(context: string): void {
    this.context = context;
  }

  error(message: any, trace?: string, context?: string): void {
    super.error(message, trace, context || this.context);
  }

  warn(message: any, context?: string): void {
    super.warn(message, context || this.context);
  }

  log(message: any, context?: string): void {
    super.log(message, context || this.context);
  }

  debug(message: any, context?: string): void {
    super.debug(message, context || this.context);
  }

  verbose(message: any, context?: string): void {
    super.verbose(message, context || this.context);
  }
}
