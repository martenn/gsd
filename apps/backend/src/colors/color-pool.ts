import { Injectable } from '@nestjs/common';
import { Color } from './color';

@Injectable()
export class ColorPool {
  private usedColors: Set<string> = new Set();

  getNextColor(): Color {
    const palette = Color.palette;
    for (const colorCode of palette) {
      if (!this.usedColors.has(colorCode)) {
        this.usedColors.add(colorCode);
        return Color.of(colorCode);
      }
    }

    throw new Error('No colors available in pool');
  }

  releaseColor(color: Color): void {
    this.usedColors.delete(color.toString());
  }

  getAvailableColors(): Color[] {
    const palette = Color.palette;
    return palette
      .filter((colorCode) => !this.usedColors.has(colorCode))
      .map((colorCode) => Color.of(colorCode));
  }

  markColorAsUsed(color: Color): void {
    const colorString = color.toString();
    if (this.usedColors.has(colorString)) {
      throw new Error(`Color ${colorString} is already in use`);
    }
    this.usedColors.add(colorString);
  }

  getPalette(): Color[] {
    return Color.palette.map((colorCode) => Color.of(colorCode));
  }
}
