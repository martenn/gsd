import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ColorPool } from './color-pool';
import { Color } from './color';

@Injectable()
export class ScanUsedColors implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly colorPool: ColorPool,
  ) {}

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
          // Ignore invalid colors from the database
        }
      }
    }
  }
}
