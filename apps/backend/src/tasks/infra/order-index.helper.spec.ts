import { OrderIndexHelper } from './order-index.helper';

describe('OrderIndexHelper', () => {
  describe('calculateTopPosition', () => {
    it('should return 1000 for empty list', () => {
      const result = OrderIndexHelper.calculateTopPosition(null);
      expect(result).toBe(1000);
    });

    it('should add 1000 to current max', () => {
      const result = OrderIndexHelper.calculateTopPosition(5000);
      expect(result).toBe(6000);
    });
  });

  describe('calculateInsertAtTop', () => {
    it('should return 1000 for empty list', () => {
      const result = OrderIndexHelper.calculateInsertAtTop(null);
      expect(result).toBe(1000);
    });

    it('should subtract 1000 from current min', () => {
      const result = OrderIndexHelper.calculateInsertAtTop(5000);
      expect(result).toBe(4000);
    });

    it('should throw error when space exhausted', () => {
      expect(() => OrderIndexHelper.calculateInsertAtTop(500)).toThrow(
        'Order index space exhausted - reindexing required',
      );
    });
  });

  describe('generateReindexedOrder', () => {
    it('should generate evenly spaced indices', () => {
      const result = OrderIndexHelper.generateReindexedOrder(3);
      expect(result).toEqual([1000, 2000, 3000]);
    });

    it('should start from custom index', () => {
      const result = OrderIndexHelper.generateReindexedOrder(3, 5000);
      expect(result).toEqual([5000, 6000, 7000]);
    });

    it('should handle single task', () => {
      const result = OrderIndexHelper.generateReindexedOrder(1);
      expect(result).toEqual([1000]);
    });

    it('should handle empty list', () => {
      const result = OrderIndexHelper.generateReindexedOrder(0);
      expect(result).toEqual([]);
    });
  });

  describe('needsReindexing', () => {
    it('should return true when min index is too low', () => {
      expect(OrderIndexHelper.needsReindexing(500)).toBe(true);
      expect(OrderIndexHelper.needsReindexing(1000)).toBe(true);
    });

    it('should return false when min index has enough space', () => {
      expect(OrderIndexHelper.needsReindexing(2000)).toBe(false);
      expect(OrderIndexHelper.needsReindexing(5000)).toBe(false);
    });
  });
});
