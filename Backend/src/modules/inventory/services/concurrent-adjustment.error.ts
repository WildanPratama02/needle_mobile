/**
 * Raised when an Adjustment's compare-and-set write finds the balance no
 * longer matches the `systemQuantity` it read — something else (a Receiving,
 * Transfer, or another Adjustment) changed the row first. Same shape and
 * handling as `InsufficientStockError`: a plain domain error, caught by type,
 * mapped to 409 at the boundary.
 */
export class ConcurrentAdjustmentError extends Error {
  constructor(
    readonly locationId: string,
    readonly needleTypeId: string,
    readonly expectedQuantity: number,
  ) {
    super(
      `Balance at location ${locationId} for needle type ${needleTypeId} changed since it was read (expected ${expectedQuantity}); retry the adjustment`,
    );
    this.name = 'ConcurrentAdjustmentError';
  }
}
