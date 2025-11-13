import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DoneController } from './adapters/done.controller';
import { GetDoneTasks } from './use-cases/get-done-tasks';
import { DoneRepository } from './infra/done.repository';
import { AppLogger } from '../logger/app-logger';

@Module({
  controllers: [DoneController],
  providers: [GetDoneTasks, DoneRepository, PrismaClient, AppLogger],
  exports: [],
})
export class DoneModule {}
