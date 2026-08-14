/**
 * The conditional decrement found too little stock to satisfy an issue.
 *
 * A domain error rather than an `HttpException`: it is raised inside a database
 * transaction, where HTTP means nothing, and mapped to 409 at the service
 * boundary. Same shape as `InvalidTransitionError` beside it.
 *
 * It exists so callers can recognise *this* failure by type instead of by
 * exception class. `/issue` previously reacted to any `ConflictException`
 * escaping its transaction, which was correct only because the method's other
 * conflicts happened to be thrown before the `try` — a future conflict raised
 * inside the transaction would have silently sent PICs an "insufficient stock"
 * notification about something else entirely.
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
