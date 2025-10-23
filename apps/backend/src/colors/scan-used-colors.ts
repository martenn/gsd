import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ColorPool, ColorCode } from './color-pool';

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
      if (list.color && this.isValidColor(list.color)) {
        this.colorPool.markColorAsUsed(list.color as ColorCode);
      }
    }
  }

  private isValidColor(color: string): color is ColorCode {
    const palette = this.colorPool.getPalette();
    return palette.includes(color as ColorCode);
  }
}
