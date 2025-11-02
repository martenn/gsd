import { LoggerService, LogLevel } from '@nestjs/common';

export interface LoggerConfig {
  logLevels: LogLevel[];
  timestamp: boolean;
  context?: string;
}

export const getLoggerConfig = (): LoggerConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    logLevels: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
    timestamp: true,
  };
};
