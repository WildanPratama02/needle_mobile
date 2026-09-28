import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';

/// One row of the transaction history (FR-MOB-014): the server's view of an
/// exchange and/or the tablet's local record of it, shown as ONE row.
///
/// [server] is the freshest *server answer* known — a `GET /exchanges` row
/// or the last snapshot the tablet kept from a sync/HTTP answer — and is the
/// only source of the Exchange State (ADR-004). [local] adds what the tablet
/// still holds: queued steps, photos, rejections. [syncState] comes from
/// [SyncStateMapper] only (nexa_mobile/CLAUDE.md §1).
final class HistoryEntry {
  const HistoryEntry({
    required this.server,
    required this.local,
    required this.syncState,
  }) : assert(server != null || local != null);

  /// Builds a row from whatever is known, choosing the freshest server answer
  /// between [serverRow] (a history page) and the tablet's kept snapshot:
  /// the server never moves an exchange backwards, so the one further along
  /// the state machine is the newer answer; a tie keeps [serverRow].
  factory HistoryEntry.of({
    ExchangeSnapshot? serverRow,
    ExchangeSyncView? local,
    bool syncing = false,
  }) {
    final kept = local?.snapshot;
    final ExchangeSnapshot? server;
    if (serverRow == null) {
      server = kept;
    } else if (kept == null) {
      server = serverRow;
    } else {
      server = kept.state.progressRank > serverRow.state.progressRank
          ? kept
          : serverRow;
    }
    final LocalSyncState state;
    if (local == null) {
      state = SyncStateMapper.forServerOnly(server!.state);
    } else {
      state = SyncStateMapper.forExchange(
        server == null ? local : local.withServerState(server.state),
        syncing: syncing,
      );
    }
    return HistoryEntry(server: server, local: local, syncState: state);
  }

  final ExchangeSnapshot? server;
  final ExchangeSyncView? local;
  final LocalSyncState syncState;

  /// Stable row identity: the server id once known, else the tablet's key.
  String get key =>
      server?.id ??
      local?.serverExchangeId ??
      'local-${local!.clientTransactionId}';

  String? get clientTransactionId => local?.clientTransactionId;
  String? get serverExchangeId => server?.id ?? local?.serverExchangeId;
  String? get exchangeNumber => server?.exchangeNumber ?? local?.exchangeNumber;

  /// Server `createdAt` when known, else the local start time.
  DateTime get createdAt =>
      server?.createdAt ?? local?.createdAt ?? DateTime(1970);

  /// Server Exchange State; `null` = the server does not know it yet.
  ExchangeState? get state => server?.state ?? local?.serverState;

  /// The operator's labels: the server's (MG-4) when sent, else what the
  /// tablet kept from the RFID lookup — so a backend without MG-4 still shows
  /// a name for this tablet's own exchanges.
  String? get operatorEmployeeNumber =>
      server?.operatorEmployeeNumber ?? local?.operatorEmployeeNumber;
  String? get operatorName => server?.operatorName ?? local?.operatorName;

  /// An operator is assigned even if no label for them is known.
  bool get hasOperator =>
      server?.operatorId != null ||
      operatorName != null ||
      operatorEmployeeNumber != null;

  String? get exchangeTypeId => server?.exchangeTypeId;
  String? get exchangeTypeCode => server?.exchangeTypeCode;
  String? get exchangeTypeName => server?.exchangeTypeName;
  String? get oldNeedleTypeId => server?.oldNeedleTypeId;
  String? get newNeedleTypeId => server?.newNeedleTypeId;
  FragmentStatus? get fragmentStatus => server?.fragmentStatus;
  String? get confirmationId => server?.confirmationId;
  ConfirmationStatus? get confirmationStatus => local?.confirmationStatus;
  DateTime? get completedAt => server?.completedAt;
  DateTime? get cancelledAt => server?.cancelledAt;

  /// Steps of this exchange still waiting on the tablet.
  int get pendingSteps => local?.queued.length ?? 0;

  /// The wizard can open it again (FR-MOB-014 detail → resume): this
  /// tablet's own record, not finished on the server, and not handed over
  /// for good — unless a rejected step brought it back to the PIC.
  bool canResume(String deviceId) {
    final l = local;
    if (l == null || l.deviceId != deviceId) return false;
    if (state?.isTerminal ?? false) return false;
    return !l.closed || l.rejected != null;
  }

  /// Whether this row passes [filter] within [window], judged on the data
  /// the tablet holds (used for local rows the server page did not return).
  /// An unknown value never matches a set filter.
  bool matches(HistoryFilter filter, HistoryWindow window) {
    if (!window.contains(createdAt)) return false;
    if (filter.status != null && state != filter.status) return false;
    if (filter.exchangeTypeId != null &&
        exchangeTypeId != filter.exchangeTypeId) {
      return false;
    }
    final needle = filter.needleTypeId;
    if (needle != null) {
      final value = switch (filter.needleRole) {
        NeedleRole.oldNeedle => oldNeedleTypeId,
        NeedleRole.newNeedle => newNeedleTypeId,
      };
      if (value != needle) return false;
    }
    return true;
  }
}
