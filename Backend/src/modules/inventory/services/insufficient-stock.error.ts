/**
 * Mirrors `modules/exchange/services/insufficient-stock.error.ts` — a plain
 * domain error, not an `HttpException`. Caught by type inside the service and
 * converted to a 409 at the boundary (spec decision #8: one error code,
 * `ConflictException`, no bespoke `INVENTORY_*` string — this codebase derives
 * error codes from HTTP status, see `common/filters/http-exception.filter.ts`).
 */
export class InsufficientStockError extends Error {
  constructor(
    readonly locationId: string,
    readonly needleTypeId: string,
    readonly requested: number,
  ) {
    super(
      `Insufficient stock at location ${locationId} for needle type ${needleTypeId}: ${requested} requested`,
    );
    this.name = 'InsufficientStockError';
  }
}
