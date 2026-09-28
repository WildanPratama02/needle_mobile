import 'dart:async';

import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_refresher.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_planner.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';

/// What one engine run did.
final class SyncRunReport {
  const SyncRunReport({
    this.ran = true,
    this.sent = 0,
    this.accepted = 0,
    this.rejected = 0,
    this.failed = 0,
    this.uploaded = 0,
    this.requestError,
    this.requestFailure,
    this.syncedAt,
  });

  const SyncRunReport.skipped() : this(ran: false);

  final bool ran;
  final int sent;
  final int accepted;
  final int rejected;
  final int failed;
  final int uploaded;

  /// Set when a sync request got no per-command answer.
  final AppError? requestError;
  final SyncRequestFailure? requestFailure;

  /// Local time of the last answered sync request of this run.
  final DateTime? syncedAt;

  bool get reachedServer => syncedAt != null;
}

/// Sends the queue through `POST /mobile/sync` and applies what comes back
/// (Doc 15 §9–14, Docs/12 §19, Docs/adr/0007).
///
/// One run:
/// 1. uploads photos whose exchange is ready for them (MG-7);
/// 2. sends up to 50 commands chosen by [planSyncBatch];
/// 3. applies each result through [SyncStateMapper] and each result's
///    authoritative `exchange`;
/// 4. stores `nextCursor`, applies `changes.exchanges` (approver decisions,
///    supervisor cancels), refreshes master data when the versions moved;
/// 5. repeats while `hasMore` or while the last round unblocked more work;
/// 6. starts the retention clock of settled exchanges and purges old ones.
///
/// Only one run is ever in flight; a run requested meanwhile waits for it and
/// then runs once more (requests coalesce).
class SyncEngine {
  SyncEngine({
    required this._queue,
    required this._gateway,
    required this._checkpoints,
    required this._exchanges,
    required this._evidence,
    required this._masterData,
    DateTime Function()? now,
    this.maxRounds = 8,
    this.retention = const Duration(days: 7),
  }) : _now = now ?? DateTime.now;

  final SyncQueue _queue;
  final SyncGateway _gateway;
  final SyncCheckpointStore _checkpoints;
  final ActiveExchangeStore _exchanges;
  final EvidenceRepository _evidence;
  final MasterDataRefresher _masterData;
  final DateTime Function() _now;

  /// Safety bound on rounds per run (pull paging + evidence resends).
  final int maxRounds;

  /// Local retention of finished exchanges (nexa_mobile/CLAUDE.md §2).
  final Duration retention;

  Future<SyncRunReport>? _running;
  Future<SyncRunReport>? _next;
  bool _nextManual = false;

  bool get isRunning => _running != null;

  /// Runs the engine for [deviceId]. [bootstrapCursor] is where pulling
  /// starts when this tablet has no cursor of its own yet. [manual]: the PIC
  /// pressed "retry now" — waiting delays are ignored for this run.
  Future<SyncRunReport> run({
    required String deviceId,
    String? bootstrapCursor,
    bool manual = false,
  }) {
    final running = _running;
    if (running != null) {
      _nextManual = _nextManual || manual;
      return _next ??= running.then((_) {
        _next = null;
        final wasManual = _nextManual;
        _nextManual = false;
        return run(
          deviceId: deviceId,
          bootstrapCursor: bootstrapCursor,
          manual: wasManual,
        );
      });
    }
    final current = _runOnce(
      deviceId,
      bootstrapCursor,
      manual,
    ).whenComplete(() => _running = null);
    _running = current;
    return current;
  }

  /// Anything to send, upload or wait for from the server? Automatic
  /// triggers skip the request when not (a manual sync always pulls).
  Future<bool> hasWork(String deviceId) async {
    if ((await _queue.unresolved()).isNotEmpty) return true;
    if ((await _evidence.awaitingUpload()).isNotEmpty) return true;
    for (final record in await _exchanges.all()) {
      if (record.deviceId != deviceId) continue;
      // Waiting for the server to move it: an approval, a supervisor cancel.
      if (record.serverExchangeId != null && !record.isTerminal) return true;
    }
    return false;
  }

  /// When the next automatic try is due, if a technical failure is waiting.
  Future<DateTime?> nextAttemptAt() async {
    DateTime? earliest;
    final byExchange = <String, SyncCommand>{};
    for (final c in await _queue.unresolved()) {
      byExchange.putIfAbsent(c.clientTransactionId, () => c);
    }
    for (final head in byExchange.values) {
      final due = head.nextAttemptAt;
      if (!head.isQueued || due == null) continue;
      if (earliest == null || due.isBefore(earliest)) earliest = due;
    }
    return earliest;
  }

  Future<SyncRunReport> _runOnce(
    String deviceId,
    String? bootstrapCursor,
    bool manual,
  ) async {
    final checkpoint = await _checkpoints.read();
    var cursor = checkpoint.deviceId == deviceId ? checkpoint.cursor : null;
    cursor ??= bootstrapCursor;

    var sent = 0, accepted = 0, rejected = 0, failed = 0, uploaded = 0;
    DateTime? syncedAt;
    var hasMore = false;
    var masterDataChecked = false;
    var cursorReset = false;

    SyncRunReport report({AppError? error, SyncRequestFailure? failure}) =>
        SyncRunReport(
          sent: sent,
          accepted: accepted,
          rejected: rejected,
          failed: failed,
          uploaded: uploaded,
          requestError: error,
          requestFailure: failure,
          syncedAt: syncedAt,
        );

    rounds:
    for (var round = 0; round < maxRounds; round++) {
      final records = {
        for (final r in await _exchanges.all()) r.clientTransactionId: r,
      };
      uploaded += await _uploadEvidence(records, deviceId);

      final commands = [
        for (final c in await _queue.unresolved())
          if (records[c.clientTransactionId]?.deviceId == deviceId) c,
      ];
      final awaitingEvidence = {
        for (final p in await _evidence.awaitingUpload()) p.clientTransactionId,
      };
      final plan = planSyncBatch(
        commands: commands,
        now: _now(),
        awaitingEvidence: awaitingEvidence,
        // Only the first round: a failure in it must not be re-sent in a
        // loop within the same run.
        ignoreBackoff: manual && round == 0,
      );
      if (plan.superseded.isNotEmpty) {
        await _queue.delete(plan.superseded.map((c) => c.commandId));
      }
      final pull = round == 0 || hasMore;
      if (plan.batch.isEmpty && !pull) break rounds;

      final answer = await _gateway.sync(
        deviceId: deviceId,
        cursor: cursor,
        commands: plan.batch,
      );
      sent += plan.batch.length;

      switch (answer) {
        case CommandFailed(:final error):
          final failure = SyncStateMapper.forRequestFailure(error);
          AppLogger.warning('sync', 'sync request failed: $error → $failure');
          switch (failure) {
            case SyncRequestFailure.badRequest
                when cursor != null && !cursorReset:
              // Most likely a cursor the backend no longer accepts: pull from
              // the start once; the commands are resent as they are.
              await _checkpoints.resetCursor(deviceId);
              cursor = null;
              cursorReset = true;
              continue;
            case SyncRequestFailure.retryLater || SyncRequestFailure.badRequest:
              await _queue.recordTechnicalFailure(
                plan.batch.map((c) => c.commandId),
                result: error.httpStatus == null ? 'NETWORK' : error.code,
                error: SyncCommandError(
                  code: error.code,
                  message: error.serverMessage ?? '',
                ),
                now: _now(),
              );
              failed += plan.batch.length;
            case SyncRequestFailure.deviceBlocked ||
                SyncRequestFailure.sessionLost:
              // The app-wide handlers take over; nothing counts as an attempt.
              AppLogger.info('sync', 'sync paused: $failure');
          }
          await _settle(deviceId);
          return report(error: error, failure: failure);

        case CommandOk(value: final response):
          syncedAt = _now();
          // Photos waiting *now* (the PIC may have accepted one while the
          // request was in flight).
          final photosWaiting = {
            ...awaitingEvidence,
            for (final p in await _evidence.awaitingUpload())
              p.clientTransactionId,
          };
          final outcome = await _applyResults(
            plan.batch,
            response.results,
            photosWaiting,
          );
          accepted += outcome.accepted;
          rejected += outcome.rejected;
          failed += outcome.failed;
          await _applyChanges(response.changedExchanges);
          cursor = response.nextCursor;
          await _checkpoints.save(
            deviceId: deviceId,
            cursor: response.nextCursor,
            syncedAt: syncedAt,
          );
          if (!masterDataChecked) {
            masterDataChecked = true;
            final refreshed = await _masterData.refresh(
              reported: response.masterDataVersions,
            );
            if (refreshed is MasterDataRefreshFailed) {
              AppLogger.warning('sync', 'master data refresh failed');
            }
          }
          hasMore = response.hasMore;
          // Nothing moved and nothing more to pull: another round would
          // resend the same thing.
          if (!hasMore && outcome.accepted == 0 && !outcome.awaitsEvidence) {
            break rounds;
          }
      }
      if (!hasMore && plan.batch.isEmpty) break rounds;
    }

    await _settle(deviceId);
    return report();
  }

  /// Uploads accepted photos of exchanges the server is ready to take them
  /// for. Returns how many went through.
  Future<int> _uploadEvidence(
    Map<String, LocalExchangeRecord> records,
    String deviceId,
  ) async {
    final photos = await _evidence.awaitingUpload();
    if (photos.isEmpty) return 0;
    var uploaded = 0;
    final blocked = <String>{};
    for (final photo in photos) {
      final ctx = photo.clientTransactionId;
      if (blocked.contains(ctx)) continue;
      final record = records[ctx];
      final snapshot = record?.serverSnapshot;
      if (record == null || snapshot == null || record.deviceId != deviceId) {
        continue;
      }
      final state = snapshot.state;
      if (state.progressRank > ExchangeState.evidenceCaptured.progressRank) {
        // The server is past evidence: the mandatory set arrived earlier (a
        // lost answer). The copy is redundant.
        await _evidence.discard(photo);
        continue;
      }
      if (!_acceptsEvidence(snapshot, record.confirmationStatus)) continue;
      final result = await _evidence.upload(snapshot.id, photo);
      switch (result) {
        case CommandOk(:final value):
          uploaded++;
          final moved = value.exchangeState;
          if (moved != null) await _exchanges.recordEvidenceState(ctx, moved);
        case CommandFailed(:final error):
          AppLogger.warning('sync', 'evidence upload failed: $error');
          // Keep the order per exchange: the next photo waits too.
          blocked.add(ctx);
      }
    }
    return uploaded;
  }

  /// Mirror of the backend's upload rule (`evidence.service.ts`): after the
  /// type (BROKEN: after the fragment check), before the new needle; a
  /// pending confirmation must be approved first.
  static bool _acceptsEvidence(
    ExchangeSnapshot exchange,
    ConfirmationStatus? confirmation,
  ) => switch (exchange.state) {
    ExchangeState.exchangeTypeSelected => !exchange.isBroken,
    ExchangeState.fragmentCheck || ExchangeState.evidenceCaptured => true,
    ExchangeState.confirmationPending =>
      confirmation == ConfirmationStatus.approved,
    _ => false,
  };

  Future<({int accepted, int rejected, int failed, bool awaitsEvidence})>
  _applyResults(
    List<SyncCommand> sent,
    List<SyncCommandResult> results,
    Set<String> awaitingEvidence,
  ) async {
    final byId = {for (final c in sent) c.commandId: c};
    var accepted = 0, rejected = 0, failed = 0;
    var awaitsEvidence = false;
    for (final result in results) {
      final command = byId[result.commandId];
      if (command == null) {
        AppLogger.warning('sync', 'result for unknown ${result.commandId}');
        continue;
      }
      final exchange = result.exchange;
      if (exchange != null) {
        await _exchanges.recordServerState(
          command.clientTransactionId,
          exchange.snapshot,
          confirmation: ConfirmationUpdate(exchange.confirmationStatus),
        );
      }
      final transition = SyncStateMapper.forResult(
        SyncCommandResult(
          commandId: result.commandId,
          clientTransactionId: result.clientTransactionId,
          commandType: result.commandType ?? command.type,
          status: result.status,
          error: result.error,
          exchange: exchange,
        ),
        evidencePending: awaitingEvidence.contains(command.clientTransactionId),
      );
      switch (transition) {
        case AcceptCommand():
          accepted++;
          await _queue.markAccepted(command.commandId, result.status);
        case RejectCommand(:final error):
          rejected++;
          AppLogger.info(
            'sync',
            '${command.type.wire} ${command.commandId} rejected: ${error.code}',
          );
          await _queue.markRejected(command.commandId, error);
        case RetryCommandLater(:final error):
          failed++;
          await _queue.recordTechnicalFailure(
            [command.commandId],
            result: SyncResultStatus.failed.wire,
            error: error,
            now: _now(),
          );
        case KeepCommandQueued():
          await _queue.markSkipped(command.commandId, result.status.wire);
        case UploadEvidenceThenResend():
          awaitsEvidence = true;
          await _queue.markSkipped(command.commandId, 'AWAITING_EVIDENCE');
      }
    }
    return (
      accepted: accepted,
      rejected: rejected,
      failed: failed,
      awaitsEvidence: awaitsEvidence,
    );
  }

  /// `changes.exchanges`: decisions made elsewhere reach the tablet here.
  /// Exchanges this tablet does not hold locally are not imported.
  Future<void> _applyChanges(List<SyncedExchange> changed) async {
    for (final exchange in changed) {
      final ctx = exchange.clientTransactionId;
      if (await _exchanges.byId(ctx) == null) continue;
      await _exchanges.recordServerState(
        ctx,
        exchange.snapshot,
        confirmation: ConfirmationUpdate(exchange.confirmationStatus),
      );
    }
  }

  /// Terminal exchanges with nothing left start their retention clock;
  /// photos of a terminal exchange can no longer be used; retention expired
  /// → purged with their queue rows.
  Future<void> _settle(String deviceId) async {
    final now = _now();
    final unresolved = {
      for (final c in await _queue.unresolved()) c.clientTransactionId,
    };
    final photos = await _evidence.awaitingUpload();
    final settled = <String>[];
    for (final record in await _exchanges.all()) {
      if (!record.isTerminal) continue;
      final ctx = record.clientTransactionId;
      if (photos.any((p) => p.clientTransactionId == ctx)) {
        await _evidence.discardAll(ctx);
      }
      if (record.syncConfirmedAt == null && !unresolved.contains(ctx)) {
        settled.add(ctx);
      }
    }
    if (settled.isNotEmpty) await _exchanges.markSyncConfirmed(settled, now);
    for (final ctx in await _exchanges.purgeConfirmedBefore(
      now.subtract(retention),
    )) {
      await _queue.deleteFor(ctx);
      await _evidence.discardAll(ctx);
    }
  }
}

/// Local photos an exchange still waits on, for the list/detail screens.
extension AwaitingEvidenceCount on List<LocalEvidence> {
  int forExchange(String clientTransactionId) =>
      where((p) => p.clientTransactionId == clientTransactionId).length;
}
