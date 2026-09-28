import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';

/// The persistent command queue (`local_sync_queue`, Doc 15 §9).
abstract interface class SyncQueue {
  /// Adds a step for the exchange [clientTransactionId] with a fresh
  /// `commandId`, behind everything already queued.
  Future<SyncCommand> enqueue({
    required String clientTransactionId,
    required SyncCommandType type,
    Map<String, Object?> payload = const {},
    required DateTime occurredAt,
  });

  /// Queued and rejected commands of every exchange, in creation order.
  Future<List<SyncCommand>> unresolved();

  /// Every command of one exchange still on the tablet (accepted ones until
  /// the retention purge), in creation order.
  Future<List<SyncCommand>> commandsFor(String clientTransactionId);

  Future<SyncCommand?> byId(String commandId);

  Future<void> markAccepted(String commandId, SyncResultStatus result);

  Future<void> markRejected(String commandId, SyncCommandError error);

  /// A technical failure (whole request or `FAILED`): one more attempt
  /// counted, next automatic try per `SyncBackoff`. [result] is the wire
  /// status, or `NETWORK` when the request got no answer at all.
  Future<void> recordTechnicalFailure(
    Iterable<String> commandIds, {
    required String result,
    SyncCommandError? error,
    required DateTime now,
  });

  /// Not attempted this time (`SKIPPED`, or waiting for its photos).
  Future<void> markSkipped(String commandId, String result);

  /// "COBA LAGI" on a rejected command: queued again, same `commandId` (the
  /// backend re-evaluates a rejection on resend).
  Future<void> requeue(String commandId);

  /// "Retry now": every waiting delay is cleared.
  Future<void> clearBackoff();

  /// Removes never-executed commands that are no longer wanted.
  Future<void> delete(Iterable<String> commandIds);

  Future<void> deleteFor(String clientTransactionId);
}

/// `POST /mobile/sync` (Docs/12 §19). No `Idempotency-Key` on the request:
/// each command is keyed by its `commandId`.
abstract interface class SyncGateway {
  Future<CommandResult<SyncResponse>> sync({
    required String deviceId,
    required String? cursor,
    required List<SyncCommand> commands,
  });
}

/// The pull cursor and last-sync time (`local_sync_state`).
final class SyncCheckpoint {
  const SyncCheckpoint({this.deviceId, this.cursor, this.lastSyncAt});

  /// The device the cursor belongs to; another device starts over.
  final String? deviceId;
  final String? cursor;

  /// Local time of the last sync the backend answered.
  final DateTime? lastSyncAt;
}

abstract interface class SyncCheckpointStore {
  Future<SyncCheckpoint> read();

  Future<void> save({
    required String deviceId,
    required String cursor,
    required DateTime syncedAt,
  });

  /// Forget the cursor (the backend refused it); the next pull starts over.
  Future<void> resetCursor(String deviceId);
}

/// Read model for the sync status UI.
abstract interface class SyncViewSource {
  Future<List<ExchangeSyncView>> load();

  /// Emits again whenever the queue, the exchanges or the photos change.
  Stream<List<ExchangeSyncView>> watch();
}
