import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppLogger } from '../logger/app-logger';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const prisma = new PrismaClient({
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
        });
        return prisma;
      },
    },
    AppLogger,
  ],
  exports: [PrismaClient],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PrismaModule.name);
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error.stack);
    }
  }
}
