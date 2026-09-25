import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

typedef _Json = Map<String, Object?>;

/// `ExchangeResponseDto` (Docs/12; `exchange-response.mapper.ts`) → domain.
ExchangeSnapshot parseExchange(Object? data) {
  final map = data! as _Json;
  final state = ExchangeState.fromWire(map['status'] as String?);
  if (state == null) {
    throw FormatException('unknown exchange status ${map['status']}');
  }
  return ExchangeSnapshot(
    id: map['id']! as String,
    exchangeNumber: map['exchangeNumber']! as String,
    state: state,
    factoryId: map['factoryId']! as String,
    trolleyId: map['trolleyId']! as String,
    deviceId: map['deviceId']! as String,
    operatorId: map['operatorId'] as String?,
    exchangeTypeId: map['exchangeTypeId'] as String?,
    exchangeTypeCode: map['exchangeTypeCode'] as String?,
    exchangeTypeName: map['exchangeTypeName'] as String?,
    oldNeedleTypeId: map['oldNeedleTypeId'] as String?,
    newNeedleTypeId: map['newNeedleTypeId'] as String?,
    fragmentStatus: FragmentStatus.fromWire(map['fragmentStatus'] as String?),
    confirmationId: map['confirmationId'] as String?,
    completedAt: _date(map['completedAt']),
    cancelledAt: _date(map['cancelledAt']),
  );
}

/// `ConfirmationResponseDto` → domain.
ConfirmationSnapshot parseConfirmation(Object? data) {
  final map = data! as _Json;
  final status = ConfirmationStatus.fromWire(map['status'] as String?);
  if (status == null) {
    throw FormatException('unknown confirmation status ${map['status']}');
  }
  String? rejectionReason;
  final decisions = map['decisions'];
  if (decisions is List<Object?>) {
    for (final d in decisions.whereType<_Json>()) {
      if (d['decision'] == 'REJECTED') {
        rejectionReason = d['reason'] as String? ?? rejectionReason;
      }
    }
  }
  return ConfirmationSnapshot(
    id: map['id']! as String,
    status: status,
    exchangeState: ExchangeState.fromWire(map['exchangeStatus'] as String?),
    confirmationNumber: map['confirmationNumber'] as String?,
    rejectionReason: rejectionReason,
    dueAt: _date(map['dueAt']),
  );
}

DateTime? _date(Object? value) =>
    value is String ? DateTime.tryParse(value) : null;

class ExchangeRemoteDataSource {
  const ExchangeRemoteDataSource(this._api);

  final ApiClient _api;

  Future<ApiResult<ExchangeSnapshot>> create({
    required String clientTransactionId,
    required String factoryId,
    required String trolleyId,
    required String deviceId,
    required String idempotencyKey,
  }) => _api.post(
    '/exchanges',
    body: {
      'clientTransactionId': clientTransactionId,
      'factoryId': factoryId,
      'trolleyId': trolleyId,
      'deviceId': deviceId,
    },
    idempotencyKey: idempotencyKey,
    decode: parseExchange,
  );

  Future<ApiResult<ExchangeSnapshot>> fetch(String id) =>
      _api.get('/exchanges/$id', decode: parseExchange);

  /// One transition endpoint (`/operator`, `/type`, `/fragment`, …).
  Future<ApiResult<ExchangeSnapshot>> transition(
    String id,
    String action, {
    required String idempotencyKey,
    Map<String, Object?> body = const {},
  }) => _api.post(
    '/exchanges/$id/$action',
    body: body,
    idempotencyKey: idempotencyKey,
    decode: parseExchange,
  );

  Future<ApiResult<ConfirmationSnapshot>> confirmation(String id) =>
      _api.get('/confirmations/$id', decode: parseConfirmation);
}
