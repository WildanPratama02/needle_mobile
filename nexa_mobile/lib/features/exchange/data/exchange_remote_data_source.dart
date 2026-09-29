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
    // MG-4: absent on a backend that predates it — optional, never required.
    operatorEmployeeNumber: map['operatorEmployeeNumber'] as String?,
    operatorName: map['operatorName'] as String?,
    exchangeTypeId: map['exchangeTypeId'] as String?,
    exchangeTypeCode: map['exchangeTypeCode'] as String?,
    exchangeTypeName: map['exchangeTypeName'] as String?,
    oldNeedleTypeId: map['oldNeedleTypeId'] as String?,
    newNeedleTypeId: map['newNeedleTypeId'] as String?,
    fragmentStatus: FragmentStatus.fromWire(map['fragmentStatus'] as String?),
    confirmationId: map['confirmationId'] as String?,
    createdAt: _date(map['createdAt']),
    completedAt: _date(map['completedAt']),
    cancelledAt: _date(map['cancelledAt']),
  );
}

/// The reverse of [parseExchange], for keeping the last server answer in
/// `local_exchange.serverSnapshot`.
Map<String, Object?> exchangeToJson(ExchangeSnapshot e) => {
  'id': e.id,
  'exchangeNumber': e.exchangeNumber,
  'status': e.state.wire,
  'factoryId': e.factoryId,
  'trolleyId': e.trolleyId,
  'deviceId': e.deviceId,
  'operatorId': e.operatorId,
  'operatorEmployeeNumber': e.operatorEmployeeNumber,
  'operatorName': e.operatorName,
  'exchangeTypeId': e.exchangeTypeId,
  'exchangeTypeCode': e.exchangeTypeCode,
  'exchangeTypeName': e.exchangeTypeName,
  'oldNeedleTypeId': e.oldNeedleTypeId,
  'newNeedleTypeId': e.newNeedleTypeId,
  'fragmentStatus': e.fragmentStatus?.wire,
  'confirmationId': e.confirmationId,
  'createdAt': e.createdAt?.toUtc().toIso8601String(),
  'completedAt': e.completedAt?.toUtc().toIso8601String(),
  'cancelledAt': e.cancelledAt?.toUtc().toIso8601String(),
};

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

  /// A transition endpoint. Only `/operator` is still called over HTTP; the
  /// later steps are sync commands (see `ExchangeRepository`).
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
