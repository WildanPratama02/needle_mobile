import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';

/// Local sync state of an exchange (Doc 15 §8). A separate vocabulary from
/// the server Exchange State (`nexa_mobile/CLAUDE.md` §1): it says where the
/// tablet's copy stands, never what the server decided.
enum LocalSyncState {
  /// Started on the tablet, not known to the server yet.
  localDraft,

  /// Steps or photos wait to be sent.
  queued,

  /// A sync request carrying this exchange is in flight.
  syncing,

  /// Everything sent was executed; the exchange is not finished on the server.
  serverAccepted,

  /// A step was refused by a business rule; the PIC must resolve it.
  serverRejected,

  /// The server reports the exchange `COMPLETED` and nothing is left to send.
  completed,
}

/// What a sync result does to its queued command.
sealed class CommandTransition {
  const CommandTransition();
}

/// `SUCCESS` / `IDEMPOTENT_SUCCESS`: executed; mark it accepted.
final class AcceptCommand extends CommandTransition {
  const AcceptCommand();
}

/// `REJECTED`: keep it as rejected; halt the rest of its exchange; never
/// resend automatically.
final class RejectCommand extends CommandTransition {
  const RejectCommand(this.error);

  final SyncCommandError error;
}

/// `FAILED` (technical): keep it queued, same `commandId`, next try per the
/// Doc 15 §14 schedule.
final class RetryCommandLater extends CommandTransition {
  const RetryCommandLater(this.error);

  final SyncCommandError? error;
}

/// `SKIPPED`: an earlier command of the exchange did not succeed; stay queued
/// behind it without counting a failure.
final class KeepCommandQueued extends CommandTransition {
  const KeepCommandQueued();
}

/// `REJECTED EXCHANGE_INVALID_STATE` for a step that needs evidence while
/// photos of that exchange are still waiting on the tablet (MG-7, Docs/12
/// §19): not a user-facing rejection — upload, then resend as is.
final class UploadEvidenceThenResend extends CommandTransition {
  const UploadEvidenceThenResend();
}

/// What a failed sync *request* (no per-command results) means.
enum SyncRequestFailure {
  /// No answer, 5xx, malformed: every sent command stays queued and is
  /// retried on the schedule.
  retryLater,

  /// `403 DEVICE_INACTIVE` / `404 DEVICE_NOT_FOUND`: the app-wide device
  /// monitor blocks the app (FR-MOB-002); stop syncing, count nothing.
  deviceBlocked,

  /// 401 that survived the interceptor's refresh-then-resend: the session is
  /// gone and the app returns to login; the queue waits for the next login.
  sessionLost,

  /// 400 on the request itself (malformed cursor): pull again from scratch.
  badRequest,
}

/// The ONE place where sync outcomes become local state (`nexa_mobile/
/// CLAUDE.md` §1, contract matrix "Sync result → local state"). Widgets,
/// repositories and the engine never decide this inline.
abstract final class SyncStateMapper {
  /// States in which the backend is waiting for evidence (evidence uploads
  /// are allowed, `SELECT_NEW_NEEDLE` is refused).
  static const evidencePhase = {
    ExchangeState.exchangeTypeSelected,
    ExchangeState.fragmentCheck,
    ExchangeState.confirmationPending,
  };

  /// Per-command result → what happens to the queued command.
  static CommandTransition forResult(
    SyncCommandResult result, {
    required bool evidencePending,
  }) {
    final error =
        result.error ??
        const SyncCommandError(code: ClientErrorCodes.temporaryServerError);
    return switch (result.status) {
      SyncResultStatus.success ||
      SyncResultStatus.idempotentSuccess => const AcceptCommand(),
      SyncResultStatus.failed => RetryCommandLater(result.error),
      SyncResultStatus.skipped => const KeepCommandQueued(),
      SyncResultStatus.rejected =>
        evidencePending && _refusedForMissingEvidence(result, error)
            ? const UploadEvidenceThenResend()
            : RejectCommand(error),
    };
  }

  static bool _refusedForMissingEvidence(
    SyncCommandResult result,
    SyncCommandError error,
  ) {
    if (!(result.commandType?.needsEvidence ?? false)) return false;
    if (error.code != BackendErrorCodes.exchangeInvalidState) return false;
    final raw = error.context['currentState'];
    final current = ExchangeState.fromWire(raw is String ? raw : null);
    return current != null && evidencePhase.contains(current);
  }

  /// Whole-request failure → what the engine does.
  static SyncRequestFailure forRequestFailure(AppError error) {
    if (error.isRetryable) return SyncRequestFailure.retryLater;
    return switch (error.code) {
      BackendErrorCodes.deviceInactive ||
      BackendErrorCodes.deviceNotFound => SyncRequestFailure.deviceBlocked,
      BackendErrorCodes.unauthorized ||
      BackendErrorCodes.authInvalidToken => SyncRequestFailure.sessionLost,
      BackendErrorCodes.validationError => SyncRequestFailure.badRequest,
      _ => SyncRequestFailure.retryLater,
    };
  }

  /// Local sync state of one exchange (Doc 15 §8).
  static LocalSyncState forExchange(
    ExchangeSyncView view, {
    bool syncing = false,
  }) {
    if (view.rejected != null) return LocalSyncState.serverRejected;
    final hasWork = view.queued.isNotEmpty || view.photosAwaitingUpload > 0;
    if (hasWork) {
      return syncing ? LocalSyncState.syncing : LocalSyncState.queued;
    }
    if (!view.hasServerRecord) return LocalSyncState.localDraft;
    if (view.serverState == ExchangeState.completed) {
      return LocalSyncState.completed;
    }
    return LocalSyncState.serverAccepted;
  }

  /// Whether the exchange counts as "Failed" on the sync card: a business
  /// rejection waiting for the PIC, or a technical failure being retried.
  static bool isFailed(ExchangeSyncView view) =>
      view.rejected != null || view.failing != null;

  /// Whether it counts as "Pending": work waiting, no failure standing.
  static bool isPending(ExchangeSyncView view) =>
      !isFailed(view) &&
      (view.queued.isNotEmpty || view.photosAwaitingUpload > 0);
}
