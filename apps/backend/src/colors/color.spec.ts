import { Color } from './color';

describe('Color', () => {
  describe('of', () => {
    it('should create Color from valid hex string', () => {
      const color = Color.of('#3B82F6');

      expect(color).toBeDefined();
      expect(color).toBeInstanceOf(Color);
    });

    it('should create Color for each palette color', () => {
      const palette = Color.palette;

      for (const colorCode of palette) {
        const color = Color.of(colorCode);
        expect(color).toBeInstanceOf(Color);
        expect(color.toString()).toBe(colorCode);
      }
    });

    it('should throw error for invalid hex color', () => {
      expect(() => Color.of('#INVALID')).toThrow(
        'Invalid color: #INVALID. Must be one of the predefined palette colors.',
      );
    });

    it('should throw error for color not in palette', () => {
      expect(() => Color.of('#FFFFFF')).toThrow(
        'Invalid color: #FFFFFF. Must be one of the predefined palette colors.',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => Color.of('')).toThrow('Invalid color: . Must be one of the predefined palette colors.');
    });

    it('should throw error for non-hex string', () => {
      expect(() => Color.of('blue')).toThrow(
        'Invalid color: blue. Must be one of the predefined palette colors.',
      );
    });
  });

  describe('toString', () => {
    it('should return hex string representation', () => {
      const color = Color.of('#3B82F6');

      expect(color.toString()).toBe('#3B82F6');
    });

    it('should return same value as input', () => {
      const hexCode = '#EF4444';
      const color = Color.of(hexCode);

      expect(color.toString()).toBe(hexCode);
    });
  });

  describe('toHexString', () => {
    it('should return hex string representation', () => {
      const color = Color.of('#10B981');

      expect(color.toHexString()).toBe('#10B981');
    });

    it('should return same value as toString', () => {
      const color = Color.of('#F59E0B');

      expect(color.toHexString()).toBe(color.toString());
    });
  });

  describe('equals', () => {
    it('should return true for same color values', () => {
      const color1 = Color.of('#3B82F6');
      const color2 = Color.of('#3B82F6');

      expect(color1.equals(color2)).toBe(true);
    });

    it('should return false for different color values', () => {
      const color1 = Color.of('#3B82F6');
      const color2 = Color.of('#EF4444');

      expect(color1.equals(color2)).toBe(false);
    });

    it('should work correctly with all palette combinations', () => {
      const palette = Color.palette;
      const colors = palette.map((code) => Color.of(code));

      for (let i = 0; i < colors.length; i++) {
        for (let j = 0; j < colors.length; j++) {
          if (i === j) {
            expect(colors[i].equals(colors[j])).toBe(true);
          } else {
            expect(colors[i].equals(colors[j])).toBe(false);
          }
        }
      }
    });
  });

  describe('palette', () => {
    it('should return all available colors', () => {
      const palette = Color.palette;

      expect(palette).toBeDefined();
      expect(palette.length).toBeGreaterThan(0);
    });

    it('should return readonly array', () => {
      const palette = Color.palette;

      expect(Array.isArray(palette)).toBe(true);
    });

    it('should contain valid hex color codes', () => {
      const palette = Color.palette;
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;

      for (const colorCode of palette) {
        expect(colorCode).toMatch(hexPattern);
      }
    });

    it('should return 15 colors', () => {
      const palette = Color.palette;

      expect(palette.length).toBe(15);
    });

    it('should have no duplicate colors', () => {
      const palette = Color.palette;
      const uniqueColors = new Set(palette);

      expect(uniqueColors.size).toBe(palette.length);
    });
  });
});
