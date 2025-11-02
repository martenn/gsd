import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ColorPool } from './color-pool';
import { Color } from './color';
import { AppLogger } from '../logger/app-logger';

@Injectable()
export class ScanUsedColors implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly colorPool: ColorPool,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ScanUsedColors.name);
  }

  async onApplicationBootstrap() {
    await this.scanExistingColors();
  }

  private async scanExistingColors(): Promise<void> {
    const listsWithColors = await this.prisma.list.findMany({
      where: {
        color: {
          not: null,
        },
        isBacklog: true,
      },
      select: {
        color: true,
      },
    });

    for (const list of listsWithColors) {
      if (list.color) {
        try {
          const color = Color.of(list.color);
          this.colorPool.markColorAsUsed(color);
        } catch {
          this.logger.error(`Invalid color ${list.color}`);
          // TODO handle on repo level or just throw
        }
      }
    }
  }
}
