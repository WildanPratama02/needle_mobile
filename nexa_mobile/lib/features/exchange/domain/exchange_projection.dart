import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';

/// The final step the PIC queued.
enum PendingClosure { complete, cancel }

/// Where the wizard shows an exchange while steps wait in the queue: the
/// last authoritative server snapshot with the queued steps laid on top.
///
/// Display only. It lets the PIC carry on offline (nexa_mobile/CLAUDE.md §2
/// "Offline scope") but is never stored, never sent and never treated as a
/// server answer: `COMPLETED` is not projected at all (a queued complete is a
/// [PendingClosure]), and every screen that shows a projected step says the
/// step is waiting to sync (Doc 17 §47, ADR-004).
final class ExchangeProjection {
  const ExchangeProjection({
    required this.exchange,
    this.pendingSteps = const {},
    this.closure,
    this.evidencePending = false,
  });

  /// Pure projection of [queued] (this exchange's commands still waiting to
  /// be sent, in order) onto [server].
  ///
  /// [exchangeType] resolves the code/name of a queued type choice from the
  /// cached master data. [evidenceComplete]: the mandatory photos are taken
  /// and waiting for upload, so the evidence step is done as far as the PIC
  /// is concerned.
  factory ExchangeProjection.of(
    ExchangeSnapshot server,
    Iterable<SyncCommand> queued, {
    ({String code, String name})? Function(String id)? exchangeType,
    bool evidenceComplete = false,
  }) {
    var e = server;
    final steps = <SyncCommandType>{};
    PendingClosure? closure;
    for (final command in queued) {
      if (!command.isQueued) continue;
      steps.add(command.type);
      final p = command.payload;
      switch (command.type) {
        case SyncCommandType.createExchange || SyncCommandType.assignOperator:
          break;
        case SyncCommandType.selectExchangeType:
          final typeId = p['exchangeTypeId'] as String?;
          final type = typeId == null ? null : exchangeType?.call(typeId);
          e = e.copyWith(
            state: ExchangeState.exchangeTypeSelected,
            exchangeTypeId: typeId,
            exchangeTypeCode: type?.code,
            exchangeTypeName: type?.name,
            oldNeedleTypeId: p['oldNeedleTypeId'] as String?,
          );
        case SyncCommandType.fragmentValidation:
          final status = FragmentStatus.fromWire(
            p['fragmentStatus'] as String?,
          );
          e = e.copyWith(
            fragmentStatus: status,
            state: status == FragmentStatus.notFound
                ? ExchangeState.confirmationPending
                : ExchangeState.fragmentCheck,
          );
        case SyncCommandType.selectNewNeedle:
          e = e.copyWith(
            state: ExchangeState.newNeedleSelected,
            newNeedleTypeId: p['needleTypeId'] as String?,
          );
        case SyncCommandType.issueNeedle:
          e = e.copyWith(state: ExchangeState.needleIssued);
        case SyncCommandType.storeUsedNeedle:
          e = e.copyWith(state: ExchangeState.usedNeedleStored);
        case SyncCommandType.completeExchange:
          closure = PendingClosure.complete;
        case SyncCommandType.cancelExchange:
          closure = PendingClosure.cancel;
      }
    }
    final inEvidencePhase = switch (e.state) {
      ExchangeState.exchangeTypeSelected => !e.isBroken,
      ExchangeState.fragmentCheck || ExchangeState.confirmationPending => true,
      _ => false,
    };
    // The photos stand in for `EVIDENCE_CAPTURED`, which the backend sets
    // itself once the uploads arrive.
    final evidencePending = evidenceComplete && inEvidencePhase;
    if (evidencePending) {
      e = e.copyWith(state: ExchangeState.evidenceCaptured);
    }
    return ExchangeProjection(
      exchange: e,
      pendingSteps: steps,
      closure: closure,
      evidencePending: evidencePending,
    );
  }

  /// What to show. Equals the server snapshot when nothing is queued.
  final ExchangeSnapshot exchange;

  /// Steps taken on the tablet and not yet confirmed by the backend.
  final Set<SyncCommandType> pendingSteps;
  final PendingClosure? closure;

  /// The mandatory photos are on the tablet, not uploaded yet.
  final bool evidencePending;

  bool get isPending =>
      pendingSteps.isNotEmpty || closure != null || evidencePending;

  /// The new needle was issued on the tablet only; the backend has not
  /// checked or moved the stock yet (Locked stock policy).
  bool get issuePending => pendingSteps.contains(SyncCommandType.issueNeedle);

  /// The fragment result waits to reach the server — for `NOT_FOUND` the
  /// approval request does not even exist yet.
  bool get fragmentPending =>
      pendingSteps.contains(SyncCommandType.fragmentValidation);
}
