import { InventoryService } from '../../../src/modules/inventory/services/inventory.service';

/**
 * `stockStatus` is the one boundary-testable piece of the lowStock/stockStatus
 * logic without a real database — the `GET /inventory/balances` `lowStock`
 * filter itself runs as raw SQL (Prisma has no cross-model column comparison)
 * and needs an e2e/DB test to exercise directly.
 */
describe('InventoryService.stockStatus', () => {
  it('is OUT at exactly zero', () => {
    expect(InventoryService.stockStatus(0, 20)).toBe('OUT');
  });

  it('is LOW at exactly the minimum stock threshold (inclusive)', () => {
    expect(InventoryService.stockStatus(20, 20)).toBe('LOW');
  });

  it('is LOW just above zero and at or below minimum stock', () => {
    expect(InventoryService.stockStatus(1, 20)).toBe('LOW');
    expect(InventoryService.stockStatus(19, 20)).toBe('LOW');
  });

  it('is NORMAL just above the minimum stock threshold', () => {
    expect(InventoryService.stockStatus(21, 20)).toBe('NORMAL');
  });

  it('is NORMAL when there is no threshold to fall under', () => {
    expect(InventoryService.stockStatus(5, 0)).toBe('NORMAL');
  });
});
