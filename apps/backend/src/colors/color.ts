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

export class Color {
  private static readonly paletteMap = new Map<ColorCode, Color>(
    COLOR_PALETTE.map((code) => [code, new Color(code)]),
  );

  private constructor(private readonly value: ColorCode) {}

  static of(colorString: string): Color {
    const color = this.paletteMap.get(colorString as ColorCode);
    if (!color) {
      throw new Error(
        `Invalid color: ${colorString}. Must be one of the predefined palette colors.`,
      );
    }
    return color;
  }

  static get palette(): readonly Color[] {
    return Array.from(this.paletteMap.values());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Color): boolean {
    return this.value === other.value;
  }
}
