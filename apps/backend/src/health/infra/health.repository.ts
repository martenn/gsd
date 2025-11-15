import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class HealthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async pingDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw<[{ result: number }]>(
        Prisma.sql`SELECT 1 as result`,
      );
      return true;
    } catch {
      return false;
    }
  }
}
