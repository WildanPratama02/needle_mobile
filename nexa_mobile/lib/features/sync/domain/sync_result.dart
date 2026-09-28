import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';

/// Per-command `status` of a sync answer (backend `SYNC_RESULT_STATUSES`).
enum SyncResultStatus {
  success('SUCCESS'),
  idempotentSuccess('IDEMPOTENT_SUCCESS'),
  rejected('REJECTED'),
  failed('FAILED'),
  skipped('SKIPPED');

  const SyncResultStatus(this.wire);

  final String wire;

  static SyncResultStatus? fromWire(String? value) {
    for (final s in values) {
      if (s.wire == value) return s;
    }
    return null;
  }
}

/// `exchange` of a result or of `changes.exchanges`: the Docs/12 §10 shape
/// plus the tablet's key and the confirmation status (`null` = not
/// required, MG-10).
final class SyncedExchange {
  const SyncedExchange({
    required this.snapshot,
    required this.clientTransactionId,
    this.confirmationStatus,
  });

  final ExchangeSnapshot snapshot;
  final String clientTransactionId;
  final ConfirmationStatus? confirmationStatus;
}

/// One entry of `results`.
final class SyncCommandResult {
  const SyncCommandResult({
    required this.commandId,
    required this.clientTransactionId,
    required this.status,
    this.commandType,
    this.error,
    this.exchange,
  });

  final String commandId;
  final String clientTransactionId;
  final SyncCommandType? commandType;
  final SyncResultStatus status;

  /// Present on `REJECTED` and `FAILED`.
  final SyncCommandError? error;

  /// The authoritative exchange after the command (or as it stands, when the
  /// command was refused). `null` when the server does not know it.
  final SyncedExchange? exchange;
}

/// The data of one `POST /mobile/sync` answer.
final class SyncResponse {
  const SyncResponse({
    required this.results,
    required this.changedExchanges,
    required this.hasMore,
    required this.masterDataVersions,
    required this.nextCursor,
    this.serverTime,
  });

  final List<SyncCommandResult> results;

  /// Every exchange of this device changed after the cursor, including
  /// changes made elsewhere (approver decision, supervisor cancel).
  final List<SyncedExchange> changedExchanges;

  /// More changes are waiting: pull again with [nextCursor].
  final bool hasMore;
  final MasterDataVersions masterDataVersions;
  final String nextCursor;
  final DateTime? serverTime;
}
