import { Test, TestingModule } from '@nestjs/testing';
import { ColorPool } from './color-pool';

describe('ColorPool', () => {
  let service: ColorPool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorPool],
    }).compile();

    service = module.get<ColorPool>(ColorPool);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get next available color', () => {
    const color = service.getNextColor();
    expect(color).toBeDefined();
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should release color back to pool', () => {
    const color = service.getNextColor();
    service.releaseColor(color);
    const availableColors = service.getAvailableColors();
    expect(availableColors).toContain(color);
  });

  it('should get available colors', () => {
    const usedColor = service.getNextColor();
    const availableColors = service.getAvailableColors();

    expect(availableColors).not.toContain(usedColor);
    expect(availableColors.length).toBeGreaterThan(0);
  });

  it('should throw error when marking already used color', () => {
    const color = service.getNextColor();

    expect(() => service.markColorAsUsed(color)).toThrow(`Color ${color} is already in use`);
  });

  it('should mark color as used when not in use', () => {
    const color = service.getNextColor();
    service.releaseColor(color);

    expect(() => service.markColorAsUsed(color)).not.toThrow();
  });
});
