import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';

/// The HTTP exchange calls: create, read, operator, confirmation read. Each
/// call goes through [RetryPolicy], which
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
  Future<CommandResult<ConfirmationSnapshot>> fetchConfirmation(
    String confirmationId,
  ) => _run(() => _remote.confirmation(confirmationId));
}
