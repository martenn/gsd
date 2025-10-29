const ORDER_STEP = 1000;
const INITIAL_ORDER_INDEX = 1000;

export class OrderIndexHelper {
  static calculateTopPosition(currentMaxOrderIndex: number | null): number {
    if (currentMaxOrderIndex === null) {
      return INITIAL_ORDER_INDEX;
    }

    return currentMaxOrderIndex + ORDER_STEP;
  }

  static calculateInsertAtTop(currentMinOrderIndex: number | null): number {
    if (currentMinOrderIndex === null) {
      return INITIAL_ORDER_INDEX;
    }

    const newIndex = currentMinOrderIndex - ORDER_STEP;

    if (newIndex <= 0) {
      throw new Error('Order index space exhausted - reindexing required');
    }

    return newIndex;
  }

  static generateReindexedOrder(
    taskCount: number,
    startIndex: number = INITIAL_ORDER_INDEX,
  ): number[] {
    const indices: number[] = [];

    for (let i = 0; i < taskCount; i++) {
      indices.push(startIndex + i * ORDER_STEP);
    }

    return indices;
  }

  static needsReindexing(minOrderIndex: number): boolean {
    return minOrderIndex <= ORDER_STEP;
  }
}
