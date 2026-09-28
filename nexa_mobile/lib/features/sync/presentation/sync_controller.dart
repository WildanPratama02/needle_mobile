import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_engine.dart';

/// What the sync engine is doing, for the header/footer/card and for the
/// wizard (which re-reads its exchange whenever [revision] moves).
final class SyncActivity {
  const SyncActivity({
    this.running = false,
    this.lastSyncAt,
    this.lastError,
    this.revision = 0,
  });

  final bool running;

  /// Local time of the last sync the backend answered.
  final DateTime? lastSyncAt;

  /// The last run's request failed as a whole (network, 5xx…); cleared by
  /// the next answered sync.
  final AppError? lastError;

  /// Bumped after every run, answered or not.
  final int revision;

  SyncActivity copyWith({
    bool? running,
    DateTime? lastSyncAt,
    AppError? lastError,
    bool clearError = false,
    int? revision,
  }) => SyncActivity(
    running: running ?? this.running,
    lastSyncAt: lastSyncAt ?? this.lastSyncAt,
    lastError: clearError ? null : (lastError ?? this.lastError),
    revision: revision ?? this.revision,
  );
}

/// Decides *when* the engine runs (FR-MOB-016, Doc 07 §35): on app start and
/// reconnect (the build below re-runs when the device validation or the
/// connectivity changes), on resume, on a periodic timer while online, when a
/// technical-failure delay expires, after the wizard queued a step while
/// online, and on "retry now". The engine itself guarantees one sync in
/// flight.
class SyncController extends Notifier<SyncActivity> {
  Timer? _periodic;
  Timer? _due;

  @override
  SyncActivity build() {
    final deviceId = ref.watch(
      deviceValidationControllerProvider.select(
        (s) => s is ValidationPassed ? s.context.device.id : null,
      ),
    );
    final online = ref.watch(
      connectivityStatusProvider.select(
        (s) => s.value == ConnectivityStatus.online,
      ),
    );
    ref.onDispose(_cancelTimers);
    final previous = stateOrNull ?? const SyncActivity();
    if (previous.lastSyncAt == null) unawaited(_loadLastSync());
    if (deviceId == null || !online) return previous.copyWith(running: false);

    final interval = ref.watch(syncPeriodicIntervalProvider);
    _periodic = Timer.periodic(interval, (_) => unawaited(_auto()));
    final lifecycle = AppLifecycleListener(onResume: () => unawaited(_auto()));
    ref.onDispose(lifecycle.dispose);
    // App start (validation just passed) or back online.
    unawaited(Future.microtask(_auto));
    return previous;
  }

  void _cancelTimers() {
    _periodic?.cancel();
    _periodic = null;
    _due?.cancel();
    _due = null;
  }

  Future<void> _loadLastSync() async {
    final checkpoint = await ref.read(syncCheckpointStoreProvider).read();
    final at = checkpoint.lastSyncAt;
    if (!ref.mounted || at == null) return;
    if (state.lastSyncAt == null) state = state.copyWith(lastSyncAt: at);
  }

  String? get _deviceId =>
      switch (ref.read(deviceValidationControllerProvider)) {
        ValidationPassed(:final context) => context.device.id,
        _ => null,
      };

  bool get _online =>
      ref.read(connectivityStatusProvider).value == ConnectivityStatus.online;

  /// Automatic trigger: only when there is something to send or to wait for.
  Future<void> _auto() async {
    final deviceId = _deviceId;
    if (deviceId == null || !_online) return;
    final engine = ref.read(syncEngineProvider);
    if (!await engine.hasWork(deviceId)) return;
    if (!ref.mounted) return;
    await syncNow();
  }

  /// Runs the engine now (the wizard after queueing a step while online, or
  /// "retry now" with [manual]). Returns `null` when no device is validated
  /// or the tablet is offline.
  Future<SyncRunReport?> syncNow({bool manual = false}) async {
    final validation = ref.read(deviceValidationControllerProvider);
    if (validation is! ValidationPassed || !_online) return null;
    final engine = ref.read(syncEngineProvider);
    if (ref.mounted) state = state.copyWith(running: true);
    final report = await engine.run(
      deviceId: validation.context.device.id,
      bootstrapCursor: validation.context.syncCursor,
      manual: manual,
    );
    if (!ref.mounted) return report;
    state = state.copyWith(
      running: engine.isRunning,
      lastSyncAt: report.syncedAt,
      lastError: report.requestError,
      clearError: report.requestError == null && report.reachedServer,
      revision: state.revision + 1,
    );
    await _scheduleDue();
    return report;
  }

  /// A technical failure is waiting out its delay (Doc 15 §14): wake up when
  /// it is due.
  Future<void> _scheduleDue() async {
    final due = await ref.read(syncEngineProvider).nextAttemptAt();
    if (!ref.mounted) return;
    _due?.cancel();
    _due = null;
    if (due == null || !_online) return;
    final wait = due.difference(DateTime.now());
    _due = Timer(
      wait.isNegative ? Duration.zero : wait,
      () => unawaited(_auto()),
    );
  }

  /// "COBA LAGI" on one rejected step: resend it as is (the backend
  /// re-evaluates a rejection, e.g. after the trolley was restocked).
  Future<void> retryRejected(String commandId) async {
    await ref.read(syncQueueProvider).requeue(commandId);
    if (!ref.mounted) return;
    await syncNow(manual: true);
  }

  /// "BATALKAN" on the Pending Sync screen: queue the PIC's cancel. It
  /// supersedes a rejected step of the same exchange (sync_planner.dart);
  /// the backend reverses stock itself if the needle was issued.
  Future<void> cancelExchange(String clientTransactionId, String reason) async {
    await ref
        .read(syncQueueProvider)
        .enqueue(
          clientTransactionId: clientTransactionId,
          type: SyncCommandType.cancelExchange,
          payload: {'reason': reason},
          occurredAt: DateTime.now(),
        );
    await ref.read(activeExchangeStoreProvider).markClosed(clientTransactionId);
    if (!ref.mounted) return;
    await syncNow(manual: true);
  }
}

final syncControllerProvider = NotifierProvider<SyncController, SyncActivity>(
  SyncController.new,
);
