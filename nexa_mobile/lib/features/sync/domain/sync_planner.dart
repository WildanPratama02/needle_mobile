import 'package:nexa_mobile/features/sync/domain/sync_command.dart';

/// Docs/12 §19: at most this many commands per sync request.
const maxSyncBatch = 50;

/// What the next sync request carries.
final class SyncPlan {
  const SyncPlan({this.batch = const [], this.superseded = const []});

  /// Commands to send, in creation order; per exchange always a prefix of its
  /// queue, so dependent steps never overtake each other (Doc 15 §12).
  final List<SyncCommand> batch;

  /// Never-executed commands made moot by a later `CANCEL_EXCHANGE` of the
  /// same exchange (see [resolveHaltedByCancel]); the caller deletes them.
  final List<SyncCommand> superseded;

  bool get isEmpty => batch.isEmpty && superseded.isEmpty;
}

/// The commands a rejection halted, and whether the PIC's own cancel is
/// among them.
///
/// A rejected step halts the rest of its exchange. When the PIC already
/// queued `CANCEL_EXCHANGE` behind it, the cancel is the decision: the
/// rejected step and anything between it and the cancel were never executed
/// on the server (rejected = nothing changed, the rest was never sent or was
/// `SKIPPED`), so they are dropped and the cancel goes out — cancelling is
/// valid from any non-terminal state and the backend reverses stock itself.
({List<SyncCommand> drop, SyncCommand? cancel}) resolveHaltedByCancel(
  List<SyncCommand> exchangeCommands,
) {
  final rejectedAt = exchangeCommands.indexWhere((c) => c.isRejected);
  if (rejectedAt < 0) return (drop: const [], cancel: null);
  final cancelAt = exchangeCommands.lastIndexWhere(
    (c) => c.isQueued && c.type == SyncCommandType.cancelExchange,
  );
  if (cancelAt < rejectedAt) return (drop: const [], cancel: null);
  return (
    drop: exchangeCommands.sublist(rejectedAt, cancelAt),
    cancel: exchangeCommands[cancelAt],
  );
}

/// Chooses the next batch (pure, unit-tested on its own).
///
/// - Sends in creation order; per exchange strictly ordered, never around a
///   command that has not succeeded.
/// - An exchange with a `REJECTED` command is halted until the PIC resolves
///   it — unless its own queued cancel supersedes the rejection.
/// - An exchange whose next command is waiting out a technical-failure delay
///   sends nothing yet ([ignoreBackoff]: the PIC pressed "retry now").
/// - While an exchange has photos waiting ([awaitingEvidence]), its steps
///   stop before the first one that needs evidence (MG-7).
/// - At most [max] commands.
SyncPlan planSyncBatch({
  required List<SyncCommand> commands,
  required DateTime now,
  Set<String> awaitingEvidence = const {},
  bool ignoreBackoff = false,
  int max = maxSyncBatch,
}) {
  final byExchange = <String, List<SyncCommand>>{};
  final ordered = [...commands]..sort((a, b) => a.sequence - b.sequence);
  for (final c in ordered) {
    if (c.status == SyncCommandStatus.accepted) continue;
    byExchange.putIfAbsent(c.clientTransactionId, () => []).add(c);
  }

  final sendable = <SyncCommand>[];
  final superseded = <SyncCommand>[];
  for (final entry in byExchange.entries) {
    var queue = entry.value;
    if (queue.any((c) => c.isRejected)) {
      final resolution = resolveHaltedByCancel(queue);
      final cancel = resolution.cancel;
      if (cancel == null) continue; // halted: the PIC decides
      superseded.addAll(resolution.drop);
      queue = queue.sublist(queue.indexOf(cancel));
    }
    final head = queue.first;
    final due = head.nextAttemptAt;
    if (!ignoreBackoff && due != null && due.isAfter(now)) continue;
    for (final c in queue) {
      if (awaitingEvidence.contains(entry.key) && c.type.needsEvidence) break;
      sendable.add(c);
    }
  }

  sendable.sort((a, b) => a.sequence - b.sequence);
  return SyncPlan(
    batch: sendable.take(max).toList(growable: false),
    superseded: superseded,
  );
}
