import { Module } from '@nestjs/common';
import { ColorPool } from './color-pool';
import { ScanUsedColors } from './scan-used-colors';

@Module({
  providers: [ColorPool, ScanUsedColors],
  exports: [ColorPool],
})
export class ColorModule {}
