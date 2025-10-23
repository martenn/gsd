import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ColorPool } from './color-pool';
import { ScanUsedColors } from './scan-used-colors';

@Module({
  providers: [
    ColorPool,
    ScanUsedColors,
    PrismaClient,
  ],
  exports: [ColorPool],
})
export class ColorModule {}
