import { Injectable } from '@nestjs/common';

const COLOR_PALETTE = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#DC2626',
  '#059669',
  '#7C3AED',
  '#BE185D',
] as const;

export type ColorCode = (typeof COLOR_PALETTE)[number];

@Injectable()
export class ColorPool {
  private usedColors: Set<ColorCode> = new Set();

  getNextColor(): ColorCode {
    for (const color of COLOR_PALETTE) {
      if (!this.usedColors.has(color)) {
        this.usedColors.add(color);
        return color;
      }
    }

    throw new Error('No colors available in pool');
  }

  releaseColor(color: ColorCode): void {
    this.usedColors.delete(color);
  }

  getAvailableColors(): ColorCode[] {
    return COLOR_PALETTE.filter((color) => !this.usedColors.has(color));
  }

  markColorAsUsed(color: ColorCode): void {
    if (this.usedColors.has(color)) {
      throw new Error(`Color ${color} is already in use`);
    }
    this.usedColors.add(color);
  }

  getPalette(): readonly ColorCode[] {
    return COLOR_PALETTE;
  }
}
