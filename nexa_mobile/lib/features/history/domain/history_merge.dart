import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';

/// Merges the server's history pages with this tablet's local exchanges into
/// one list (FR-MOB-014, Doc 07 §30 "Sync Status", Doc 15 §19):
///
/// - a server row and the local record of the same exchange (matched on the
///   server id) become ONE row: the freshest server answer for the data and
///   the Exchange State, the local sync state layered on top;
/// - local exchanges the server does not return are added when they are not
///   fully synced (never answered by `POST /exchanges`, or steps/photos still
///   waiting or rejected) and pass the filter — so a queued exchange is
///   always visible, with its badge;
/// - with no server answer at all ([serverAvailable] `false`: offline or the
///   read failed), every local exchange of this device that passes the
///   filter is shown — the tablet's saved copies, never invented server rows;
/// - only [deviceId]'s exchanges; a server row repeated across pages (rows
///   shifting while paging) is kept once;
/// - newest first.
List<HistoryEntry> mergeHistory({
  required List<ExchangeSnapshot> serverRows,
  required List<ExchangeSyncView> localViews,
  required String deviceId,
  required HistoryFilter filter,
  required HistoryWindow window,
  required bool serverAvailable,
  bool syncing = false,
}) {
  final mine = [
    for (final v in localViews)
      if (v.deviceId == deviceId) v,
  ];
  final localByServerId = {
    for (final v in mine)
      if (v.serverExchangeId != null) v.serverExchangeId!: v,
  };

  final entries = <HistoryEntry>[];
  final seenServerIds = <String>{};
  final usedLocal = <String>{};
  for (final row in serverRows) {
    if (row.deviceId != deviceId) continue;
    if (!seenServerIds.add(row.id)) continue;
    final local = localByServerId[row.id];
    if (local != null) usedLocal.add(local.clientTransactionId);
    entries.add(
      HistoryEntry.of(serverRow: row, local: local, syncing: syncing),
    );
  }

  for (final local in mine) {
    if (usedLocal.contains(local.clientTransactionId)) continue;
    final unsynced = local.serverExchangeId == null || local.unresolved;
    if (serverAvailable && !unsynced) continue;
    final entry = HistoryEntry.of(local: local, syncing: syncing);
    if (entry.matches(filter, window)) entries.add(entry);
  }

  entries.sort((a, b) {
    final byTime = b.createdAt.compareTo(a.createdAt);
    return byTime != 0 ? byTime : b.key.compareTo(a.key);
  });
  return entries;
}
