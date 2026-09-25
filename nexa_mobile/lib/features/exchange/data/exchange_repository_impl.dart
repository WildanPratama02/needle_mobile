import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';

/// Online exchange commands. Each call goes through [RetryPolicy], which
/// resends only on `NETWORK_TIMEOUT` / `TEMPORARY_SERVER_ERROR` and always
/// with the caller's `Idempotency-Key` (Doc 07 §41, Docs/12 §25).
class ExchangeRepositoryImpl implements ExchangeRepository {
  const ExchangeRepositoryImpl(this._remote, this._retry);

  final ExchangeRemoteDataSource _remote;
  final RetryPolicy _retry;

  Future<CommandResult<T>> _run<T>(Future<ApiResult<T>> Function() call) async {
    final result = await _retry.run(call);
    return switch (result) {
      ApiSuccess(:final data) => CommandOk(data),
      ApiFailure(:final error) => CommandFailed(error),
    };
  }

  @override
  Future<CommandResult<ExchangeSnapshot>> create({
    required String clientTransactionId,
    required String factoryId,
    required String trolleyId,
    required String deviceId,
    required String idempotencyKey,
  }) => _run(
    () => _remote.create(
      clientTransactionId: clientTransactionId,
      factoryId: factoryId,
      trolleyId: trolleyId,
      deviceId: deviceId,
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> fetch(String exchangeId) =>
      _run(() => _remote.fetch(exchangeId));

  @override
  Future<CommandResult<ExchangeSnapshot>> identifyOperator(
    String exchangeId, {
    required String rfidUid,
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'operator',
      body: {'rfidUid': rfidUid},
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> selectType(
    String exchangeId, {
    required String exchangeTypeId,
    required String oldNeedleTypeId,
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'type',
      body: {
        'exchangeTypeId': exchangeTypeId,
        'oldNeedleTypeId': oldNeedleTypeId,
      },
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> recordFragment(
    String exchangeId, {
    required FragmentStatus fragmentStatus,
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'fragment',
      body: {'fragmentStatus': fragmentStatus.wire},
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> selectNewNeedle(
    String exchangeId, {
    required String needleTypeId,
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'new-needle',
      body: {'needleTypeId': needleTypeId},
      idempotencyKey: idempotencyKey,
    ),
  );

  /// `quantity` is omitted: the backend defaults to 1 and the PIC may not
  /// change it (Doc 07 §24).
  @override
  Future<CommandResult<ExchangeSnapshot>> issue(
    String exchangeId, {
    required String idempotencyKey,
  }) => _run(
    () =>
        _remote.transition(exchangeId, 'issue', idempotencyKey: idempotencyKey),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> storeUsedNeedle(
    String exchangeId, {
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'store-used-needle',
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> complete(
    String exchangeId, {
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'complete',
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ExchangeSnapshot>> cancel(
    String exchangeId, {
    required String reason,
    required String idempotencyKey,
  }) => _run(
    () => _remote.transition(
      exchangeId,
      'cancel',
      body: {'reason': reason},
      idempotencyKey: idempotencyKey,
    ),
  );

  @override
  Future<CommandResult<ConfirmationSnapshot>> fetchConfirmation(
    String confirmationId,
  ) => _run(() => _remote.confirmation(confirmationId));
}
