import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// Outcome of one exchange command or read. Business outcomes are values, not
/// exceptions.
sealed class CommandResult<T> {
  const CommandResult();
}

final class CommandOk<T> extends CommandResult<T> {
  const CommandOk(this.value);

  final T value;
}

final class CommandFailed<T> extends CommandResult<T> {
  const CommandFailed(this.error);

  final AppError error;
}

/// The online exchange endpoints (Docs/12, contract matrix `exchange` rows).
///
/// Every mutating call takes the `Idempotency-Key` chosen by the caller
/// (`IdempotencyAttempts`); the implementation retries only the Doc 07 §41
/// whitelist, resending the same key.
abstract interface class ExchangeRepository {
  /// `POST /exchanges` — factory/trolley/device come from the device context
  /// (Doc 07 §4), never from the PIC.
  Future<CommandResult<ExchangeSnapshot>> create({
    required String clientTransactionId,
    required String factoryId,
    required String trolleyId,
    required String deviceId,
    required String idempotencyKey,
  });

  Future<CommandResult<ExchangeSnapshot>> fetch(String exchangeId);

  /// `POST /exchanges/{id}/operator { rfidUid }`.
  Future<CommandResult<ExchangeSnapshot>> identifyOperator(
    String exchangeId, {
    required String rfidUid,
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/type { exchangeTypeId, oldNeedleTypeId }`.
  Future<CommandResult<ExchangeSnapshot>> selectType(
    String exchangeId, {
    required String exchangeTypeId,
    required String oldNeedleTypeId,
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/fragment { fragmentStatus }` (BROKEN only).
  Future<CommandResult<ExchangeSnapshot>> recordFragment(
    String exchangeId, {
    required FragmentStatus fragmentStatus,
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/new-needle { needleTypeId }` — the pre-issue stock
  /// hint: `409 INVENTORY_INSUFFICIENT_STOCK` when the trolley has none.
  Future<CommandResult<ExchangeSnapshot>> selectNewNeedle(
    String exchangeId, {
    required String needleTypeId,
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/issue` — the backend decrements stock atomically;
  /// final only when it answers (ADR-004).
  Future<CommandResult<ExchangeSnapshot>> issue(
    String exchangeId, {
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/store-used-needle` — the backend resolves the
  /// storage mapping itself.
  Future<CommandResult<ExchangeSnapshot>> storeUsedNeedle(
    String exchangeId, {
    required String idempotencyKey,
  });

  Future<CommandResult<ExchangeSnapshot>> complete(
    String exchangeId, {
    required String idempotencyKey,
  });

  /// `POST /exchanges/{id}/cancel { reason }` — after issue the backend
  /// writes the stock reversal.
  Future<CommandResult<ExchangeSnapshot>> cancel(
    String exchangeId, {
    required String reason,
    required String idempotencyKey,
  });

  /// `GET /confirmations/{id}` (`CONFIRMATION_VIEW`; the exchange routes carry
  /// only `confirmationId`, MG-10).
  Future<CommandResult<ConfirmationSnapshot>> fetchConfirmation(
    String confirmationId,
  );
}

/// The pointer to this tablet's one unfinished exchange (`local_exchange`).
final class LocalExchangeRecord {
  const LocalExchangeRecord({
    required this.clientTransactionId,
    required this.createIdempotencyKey,
    required this.deviceId,
    this.serverExchangeId,
    this.exchangeNumber,
    this.lastKnownState,
    this.operator,
  });

  final String clientTransactionId;
  final String createIdempotencyKey;
  final String deviceId;
  final String? serverExchangeId;
  final String? exchangeNumber;
  final ExchangeState? lastKnownState;
  final OperatorIdentity? operator;
}

/// Local persistence needed to resume after the app was killed. Not a sync
/// queue (Phase 9): nothing here is ever sent on its own.
abstract interface class ActiveExchangeStore {
  /// The unfinished exchange of [deviceId], if any. Rows of another device
  /// are dropped.
  Future<LocalExchangeRecord?> current(String deviceId);

  /// Written **before** `POST /exchanges` is sent.
  Future<void> begin(LocalExchangeRecord record);

  /// After any server answer: remember the id, number and last state.
  Future<void> recordServerState(
    String clientTransactionId,
    ExchangeSnapshot exchange,
  );

  Future<void> recordOperator(
    String clientTransactionId,
    OperatorIdentity operator,
  );

  /// The exchange is terminal on the server (or gone): forget it.
  Future<void> finish(String clientTransactionId);
}
