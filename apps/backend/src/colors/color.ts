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
  private constructor(private readonly value: ColorCode) {}

  static of(colorString: string): Color {
    if (!COLOR_PALETTE.includes(colorString as ColorCode)) {
      throw new Error(
        `Invalid color: ${colorString}. Must be one of the predefined palette colors.`,
      );
    }
    return new Color(colorString as ColorCode);
  }

  static get palette(): readonly ColorCode[] {
    return COLOR_PALETTE;
  }

  toString(): string {
    return this.value;
  }

  toHexString(): string {
    return this.value;
  }

  equals(other: Color): boolean {
    return this.value === other.value;
  }
}
