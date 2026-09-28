import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';

typedef _Json = Map<String, Object?>;

/// The request body of `POST /mobile/sync` (Docs/12 §19).
Map<String, Object?> syncRequestBody({
  required String deviceId,
  required String? cursor,
  required List<SyncCommand> commands,
}) => {
  'deviceId': deviceId,
  'cursor': cursor,
  'commands': [
    for (final c in commands)
      {
        'commandId': c.commandId,
        'clientTransactionId': c.clientTransactionId,
        'commandType': c.type.wire,
        'occurredAt': c.occurredAt.toUtc().toIso8601String(),
        'payload': c.payload,
      },
  ],
};

/// `SyncResponseDto` (`mobile-response.dto.ts`) → domain.
SyncResponse parseSyncResponse(Object? data) {
  final map = data! as _Json;
  final changes = map['changes']! as _Json;
  final serverTime = map['serverTime'];
  return SyncResponse(
    results: [
      for (final r in (map['results']! as List<Object?>).cast<_Json>())
        _result(r),
    ],
    changedExchanges: [
      for (final e in (changes['exchanges']! as List<Object?>).cast<_Json>())
        parseSyncedExchange(e),
    ],
    hasMore: changes['hasMore'] == true,
    masterDataVersions: MasterDataVersions.fromWire(
      changes['masterDataVersions'],
    ),
    nextCursor: map['nextCursor']! as String,
    serverTime: serverTime is String ? DateTime.tryParse(serverTime) : null,
  );
}

/// `MobileExchangeDto`: the exchange plus `clientTransactionId` and
/// `confirmationStatus`.
SyncedExchange parseSyncedExchange(Map<String, Object?> map) => SyncedExchange(
  snapshot: parseExchange(map),
  clientTransactionId: map['clientTransactionId']! as String,
  confirmationStatus: ConfirmationStatus.fromWire(
    map['confirmationStatus'] as String?,
  ),
);

SyncCommandResult _result(_Json r) {
  final status = SyncResultStatus.fromWire(r['status'] as String?);
  if (status == null) {
    throw FormatException('unknown sync result status ${r['status']}');
  }
  final error = r['error'];
  final exchange = r['exchange'];
  return SyncCommandResult(
    commandId: r['commandId']! as String,
    clientTransactionId: r['clientTransactionId']! as String,
    commandType: SyncCommandType.fromWire(r['commandType'] as String?),
    status: status,
    error: error is _Json
        ? SyncCommandError(
            code: error['code'] as String? ?? 'UNKNOWN',
            message: error['message'] as String? ?? '',
            context: error['context'] is _Json
                ? error['context']! as _Json
                : const {},
          )
        : null,
    exchange: exchange is _Json ? parseSyncedExchange(exchange) : null,
  );
}

/// [SyncGateway] over the shared [ApiClient] (`X-Device-ID`, bearer token,
/// 401 → refresh → resend, device-access monitor all come with it).
class SyncRemoteDataSource implements SyncGateway {
  const SyncRemoteDataSource(this._api);

  final ApiClient _api;

  @override
  Future<CommandResult<SyncResponse>> sync({
    required String deviceId,
    required String? cursor,
    required List<SyncCommand> commands,
  }) async {
    // No Idempotency-Key on the request itself: replaying a whole stored
    // sync answer would hand back a stale cursor (Docs/12 §19).
    final result = await _api.post(
      '/mobile/sync',
      body: syncRequestBody(
        deviceId: deviceId,
        cursor: cursor,
        commands: commands,
      ),
      decode: parseSyncResponse,
    );
    return switch (result) {
      ApiSuccess(:final data) => CommandOk(data),
      ApiFailure(:final error) => CommandFailed(error),
    };
  }
}
