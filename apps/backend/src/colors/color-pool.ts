import { Injectable } from '@nestjs/common';
import { Color } from './color';

@Injectable()
export class ColorPool {
  private usedColors: Set<Color> = new Set();

  getNextColor(): Color {
    const palette = Color.palette;
    for (const color of palette) {
      if (!this.usedColors.has(color)) {
        this.usedColors.add(color);
        return color;
      }
    }

    throw new Error('No colors available in pool');
  }

  releaseColor(color: Color): void {
    this.usedColors.delete(color);
  }

  getAvailableColors(): Color[] {
    return Color.palette.filter((color) => !this.usedColors.has(color));
  }

  markColorAsUsed(color: Color): void {
    if (this.usedColors.has(color)) {
      throw new Error(`Color ${color.toString()} is already in use`);
    }
    this.usedColors.add(color);
  }
}
