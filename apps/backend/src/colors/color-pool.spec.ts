import { Test, TestingModule } from '@nestjs/testing';
import { ColorPool } from './color-pool';
import { Color } from './color';

describe('ColorPool', () => {
  let service: ColorPool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorPool],
    }).compile();

    service = module.get<ColorPool>(ColorPool);
  });

  it('should get next available color', () => {
    const color = service.getNextColor();
    expect(color.toString()).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should release color back to pool', () => {
    const color = service.getNextColor();
    service.releaseColor(color);
    const availableColors = service.getAvailableColors();
    const hasColor = availableColors.some((c) => c.equals(color));
    expect(hasColor).toBe(true);
  });

  it('should get available colors', () => {
    const usedColor = service.getNextColor();
    const availableColors = service.getAvailableColors();

    const hasUsedColor = availableColors.some((c) => c.equals(usedColor));
    expect(hasUsedColor).toBe(false);
    expect(availableColors.length).toBeGreaterThan(0);
  });

  it('should throw error when marking already used color', () => {
    const color = service.getNextColor();

    expect(() => service.markColorAsUsed(color)).toThrow(
      `Color ${color.toString()} is already in use`,
    );
  });

  it('should mark color as used when not in use', () => {
    const color = service.getNextColor();
    service.releaseColor(color);

    expect(() => service.markColorAsUsed(color)).not.toThrow();
  });
});
