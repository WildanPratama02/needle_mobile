import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/idempotency_attempts.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_error_route.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_projection.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_state.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/presentation/trolley_stock_controller.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_providers.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_planner.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:uuid/uuid.dart';

/// Drives the exchange wizard (Docs/21 phases 5–9).
///
/// Rules it enforces:
/// - the step always comes from the latest server answer through
///   [ExchangeStepMapper] (Doc 17 §46) — with the steps still queued on the
///   tablet laid on top ([ExchangeProjection]) and marked as waiting to sync;
/// - starting an exchange and identifying the operator are HTTP calls and
///   need a connection (MG-6); every later step is a queued `/mobile/sync`
///   command, online or offline — online it is sent at once and the wizard
///   waits for the answer, offline it waits in the queue. One path per step,
///   so a step is never sent twice under two keys;
/// - commands run one at a time ([ExchangeFlowState.busy]), in the Doc 15 §12
///   order;
/// - nothing is shown as issued/completed until the backend says so
///   (ADR-004): a queued issue is labelled unconfirmed, a queued complete is
///   [ExchangeFlowStep.awaitingSync], never "done".
class ExchangeFlowController extends Notifier<ExchangeFlowState> {
  final _attempts = IdempotencyAttempts();
  final _uuid = const Uuid();
  final _errors = const ErrorMapper();
  Timer? _poll;
  Future<void> Function()? _retryAction;

  /// The local record of the exchange being worked on.
  LocalExchangeRecord? _record;
  DeviceContextSnapshot? _device;

  /// Evidence types the server confirmed (last online read / upload).
  final Set<EvidenceType> _serverEvidence = {};

  ExchangeRepository get _exchanges => ref.read(exchangeRepositoryProvider);
  ActiveExchangeStore get _store => ref.read(activeExchangeStoreProvider);
  SyncQueue get _queue => ref.read(syncQueueProvider);
  EvidenceRepository get _evidence => ref.read(evidenceRepositoryProvider);

  @override
  ExchangeFlowState build() {
    ref.onDispose(() => _poll?.cancel());
    ref.listen(connectivityStatusProvider, (_, next) {
      final offline = next.value == ConnectivityStatus.offline;
      if (offline != state.offline) state = state.copyWith(offline: offline);
      // Back online after "needs connection" at start: try again by itself.
      if (!offline && state.startFailed && state.canRetry && !state.busy) {
        unawaited(start());
      }
    });
    // Every sync run may have moved this exchange (a result, an approval
    // pulled, a rejection): re-read it.
    ref.listen(syncControllerProvider.select((s) => s.revision), (_, _) {
      if (!state.busy && _record != null && state.exchange != null) {
        unawaited(_reloadLocal(keepNotice: true));
      }
    });
    final offline =
        ref.read(connectivityStatusProvider).value ==
        ConnectivityStatus.offline;
    unawaited(Future.microtask(start));
    return ExchangeFlowState(offline: offline, busy: true);
  }

  // -------------------------------------------------------------------------
  // Start / resume
  // -------------------------------------------------------------------------

  /// Opens a new exchange, or resumes one: the exchange the Pending Sync
  /// screen asked for, else this device's unfinished one.
  Future<void> start() async {
    if (!ref.mounted) return;
    state = state.copyWith(
      step: ExchangeFlowStep.starting,
      busy: true,
      notice: null,
      startFailed: false,
      canRetry: false,
    );
    final validation = ref.read(deviceValidationControllerProvider);
    if (validation is! ValidationPassed) {
      _startFailed(
        const FlowNotice(
          AppStrings.exchangeNoDeviceContext,
          FlowNoticeKind.error,
        ),
      );
      return;
    }
    _device = validation.context;
    final deviceId = validation.context.device.id;

    final requested =
        _record?.clientTransactionId ??
        ref.read(exchangeOpenRequestProvider.notifier).take();
    final existing = requested != null
        ? await _store.byId(requested)
        : await _store.current(deviceId);
    if (!ref.mounted) return;

    if (existing == null) {
      await _startNew(deviceId);
      return;
    }
    _record = existing;
    state = state.copyWith(operator: existing.operator);
    if (!state.offline) {
      // Phase 5: bring the catalogues up to date (versions sent, unchanged
      // collections come back null and are kept). A failure keeps the cache.
      await ref.read(masterDataRefresherProvider).refresh();
      if (!ref.mounted) return;
    }
    await _loadCatalog();
    if (!ref.mounted) return;

    final serverId = existing.serverExchangeId;
    if (serverId == null) {
      // The create never answered: only the server can say whether it exists.
      if (state.offline) {
        _needsConnection();
        return;
      }
      await _handleStartResult(await _sendCreate(existing));
      return;
    }
    if (!state.offline) {
      final fetched = await _exchanges.fetch(serverId);
      if (!ref.mounted) return;
      switch (fetched) {
        case CommandOk(:final value):
          await _apply(value);
          return;
        case CommandFailed(:final error)
            when !error.isRetryable || existing.serverSnapshot == null:
          await _handleStartResult(fetched);
          return;
        case CommandFailed():
          break; // unreachable server: continue from the local copy
      }
    }
    // Offline (or the server is unreachable): continue from the last server
    // answer kept on the tablet plus the queued steps.
    if (existing.serverSnapshot == null) {
      _needsConnection();
      return;
    }
    await _reloadLocal();
  }

  void _needsConnection() => _startFailed(
    const FlowNotice(
      AppStrings.exchangeNeedsConnection,
      FlowNoticeKind.warning,
    ),
    retry: true,
  );

  Future<void> _startNew(String deviceId) async {
    if (state.offline) {
      _needsConnection();
      return;
    }
    await ref.read(masterDataRefresherProvider).refresh();
    if (!ref.mounted) return;
    await _loadCatalog();
    if (!ref.mounted) return;
    final record = LocalExchangeRecord(
      clientTransactionId: _uuid.v4(),
      createIdempotencyKey: _uuid.v4(),
      deviceId: deviceId,
    );
    // Persisted before sending, so a kill during the request resumes this
    // same create (same clientTransactionId and key → same exchange).
    await _store.begin(record);
    _record = record;
    await _handleStartResult(await _sendCreate(record));
  }

  Future<void> _handleStartResult(
    CommandResult<ExchangeSnapshot> result,
  ) async {
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        await _apply(value);
      case CommandFailed(:final error):
        final route = routeExchangeError(ExchangeCommand.create, error);
        if (route is ExchangeGone) {
          await _forgetRecord();
          _record = null;
          _startFailed(
            const FlowNotice(AppStrings.exchangeGone, FlowNoticeKind.warning),
          );
        } else {
          _startFailed(
            FlowNotice.error(error),
            retry: route is TransientFailure,
          );
        }
    }
  }

  Future<CommandResult<ExchangeSnapshot>> _sendCreate(
    LocalExchangeRecord record,
  ) {
    final device = _device!;
    return _exchanges.create(
      clientTransactionId: record.clientTransactionId,
      factoryId: device.factory.id,
      trolleyId: device.trolley.id,
      deviceId: device.device.id,
      idempotencyKey: record.createIdempotencyKey,
    );
  }

  void _startFailed(FlowNotice notice, {bool retry = false}) {
    if (!ref.mounted) return;
    _retryAction = retry ? start : null;
    state = state.copyWith(
      step: ExchangeFlowStep.starting,
      busy: false,
      notice: notice,
      startFailed: true,
      canRetry: retry,
    );
  }

  Future<void> _loadCatalog() async {
    final repo = ref.read(masterDataRepositoryProvider);
    final catalog = ExchangeCatalog(
      needleTypes: await repo.needleTypes(),
      exchangeTypes: await repo.exchangeTypes(),
      storageMappings: await repo.storageMappings(),
    );
    if (ref.mounted) state = state.copyWith(catalog: catalog);
  }

  // -------------------------------------------------------------------------
  // Applying a server answer / re-reading the local record
  // -------------------------------------------------------------------------

  /// An HTTP answer (create, operator, `GET /exchanges/{id}`): store it as
  /// the latest server state, then render.
  Future<void> _apply(ExchangeSnapshot exchange, {FlowNotice? notice}) async {
    final record = _record;
    if (record == null) return;
    await _store.recordServerState(record.clientTransactionId, exchange);
    ConfirmationSnapshot? confirmation = state.confirmation;
    if (exchange.state == ExchangeState.confirmationPending &&
        exchange.confirmationId != null) {
      final read = await _exchanges.fetchConfirmation(exchange.confirmationId!);
      if (read is CommandOk<ConfirmationSnapshot>) {
        confirmation = read.value;
        await _store.recordConfirmation(
          record.clientTransactionId,
          read.value.status,
        );
      }
    } else if (exchange.confirmationId == null) {
      confirmation = null;
    }
    if (!ref.mounted) return;
    state = state.copyWith(confirmation: confirmation);
    await _reloadLocal(notice: notice);
  }

  /// The single path by which the screen changes: the last server answer
  /// kept on the tablet + this exchange's queued steps and photos →
  /// projection → step.
  Future<void> _reloadLocal({
    FlowNotice? notice,
    bool keepNotice = false,
  }) async {
    final ctx = _record?.clientTransactionId;
    if (ctx == null) return;
    final record = await _store.byId(ctx);
    if (!ref.mounted) return;
    final server = record?.serverSnapshot;
    if (record == null || server == null) {
      state = state.copyWith(busy: false, notice: notice ?? state.notice);
      return;
    }
    _record = record;

    var commands = await _queue.commandsFor(ctx);
    if (commands.any((c) => c.isRejected)) {
      final resolution = resolveHaltedByCancel(commands);
      if (resolution.cancel == null) {
        final rejected = commands.firstWhere((c) => c.isRejected);
        await _handleRejection(rejected, commands, server);
        return;
      }
      // The PIC's own cancel supersedes the rejection (sync_planner.dart).
      await _queue.delete(resolution.drop.map((c) => c.commandId));
      commands = await _queue.commandsFor(ctx);
    }
    final queued = [
      for (final c in commands)
        if (c.isQueued) c,
    ];
    final photos = await _evidence.pending(ctx);
    if (!ref.mounted) return;
    final queuedPhotoTypes = {
      for (final p in photos)
        if (p.status == LocalEvidenceStatus.queued) p.type,
    };

    ({String code, String name})? typeOf(String id) {
      final type = state.catalog.exchangeType(id);
      return type == null ? null : (code: type.code, name: type.name);
    }

    final plain = ExchangeProjection.of(server, queued, exchangeType: typeOf);
    final evidenceComplete =
        queuedPhotoTypes.isNotEmpty &&
        EvidencePolicy.isComplete(plain.exchange.fragmentStatus, {
          ..._serverEvidence,
          ...queuedPhotoTypes,
        });
    final projection = evidenceComplete
        ? ExchangeProjection.of(
            server,
            queued,
            exchangeType: typeOf,
            evidenceComplete: true,
          )
        : plain;
    final exchange = projection.exchange;

    // A queued NOT_FOUND has not raised its confirmation yet: pending.
    final confirmationStatus = projection.fragmentPending
        ? null
        : (record.confirmationStatus ?? state.confirmation?.status);

    final justFinished =
        server.state.isTerminal &&
        !(state.serverExchange?.state.isTerminal ?? false);
    if (justFinished) {
      await _evidence.discardAll(ctx);
      _refreshHome();
      if (!ref.mounted) return;
    }

    final keepCandidate = exchange.state == ExchangeState.created;
    final keepOldNeedle = exchange.state == ExchangeState.operatorIdentified;
    final step = ExchangeStepMapper.stepFor(
      exchange,
      confirmationStatus: confirmationStatus,
      hasOperatorCandidate: keepCandidate && state.operatorCandidate != null,
      hasOldNeedleChoice: keepOldNeedle && state.oldNeedle != null,
      closurePending: projection.closure != null,
    );
    final syncState = SyncStateMapper.forExchange(
      ExchangeSyncView(
        clientTransactionId: ctx,
        createdAt: record.createdAt ?? DateTime.now(),
        serverState: server.state,
        hasServerRecord: true,
        commands: commands,
        photosAwaitingUpload: queuedPhotoTypes.length,
      ),
      syncing: ref.read(syncControllerProvider).running,
    );
    final enteringEvidence =
        step == ExchangeFlowStep.evidence &&
        state.step != ExchangeFlowStep.evidence;
    final sameStep = step == state.step;
    state = state.copyWith(
      step: step,
      exchange: exchange,
      serverExchange: server,
      projection: projection.isPending ? projection : null,
      syncState: syncState,
      operator: state.operator ?? record.operator,
      operatorCandidate: keepCandidate ? state.operatorCandidate : null,
      oldNeedle: keepOldNeedle ? state.oldNeedle : null,
      newNeedleChoice: step == ExchangeFlowStep.newNeedle
          ? (state.newNeedleChoice ??
                state.catalog.needle(exchange.oldNeedleTypeId))
          : state.newNeedleChoice,
      evidence: enteringEvidence ? const EvidenceProgress() : null,
      busy: false,
      notice: keepNotice && sameStep ? state.notice : notice,
      canRetry: keepNotice && sameStep && state.canRetry,
      stockProblem: sameStep ? state.stockProblem : null,
      startFailed: false,
      cancelledAfterIssue:
          server.state == ExchangeState.cancelled &&
          commands.any(
            (c) =>
                c.type == SyncCommandType.issueNeedle &&
                c.status == SyncCommandStatus.accepted,
          ),
      approvedNotice:
          step == ExchangeFlowStep.evidence &&
          confirmationStatus == ConfirmationStatus.approved,
    );
    _syncPolling();
    if (enteringEvidence) await _loadEvidenceProgress();
  }

  /// A queued step came back `REJECTED`. Its later steps were never executed
  /// (halted), so they are dropped with it; the exchange is back with the
  /// PIC at the authoritative state, with the reason shown (Doc 15 §13 — no
  /// silent overwrite).
  Future<void> _handleRejection(
    SyncCommand rejected,
    List<SyncCommand> commands,
    ExchangeSnapshot server,
  ) async {
    final ctx = rejected.clientTransactionId;
    final cause = rejected.lastError;
    final error = _errors.fromCommandError(
      code: cause?.code ?? BackendErrorCodes.unprocessableEntity,
      message: cause?.message ?? '',
      context: cause?.context ?? const {},
    );
    AppLogger.warning('exchange', '${rejected.type.wire} rejected: $error');
    await _queue.delete([
      for (final c in commands)
        if (c.sequence >= rejected.sequence &&
            c.status != SyncCommandStatus.accepted)
          c.commandId,
    ]);
    await _store.reopen(ctx);
    if (!ref.mounted) return;

    final route = routeExchangeError(_commandFor(rejected.type), error);
    FlowNotice? notice;
    StockProblem? stockProblem;
    switch (route) {
      case StockUnavailable(:final availableQuantity):
        final needleId = rejected.type == SyncCommandType.selectNewNeedle
            ? rejected.payload['needleTypeId'] as String?
            : server.newNeedleTypeId;
        stockProblem = StockProblem(
          needle: state.catalog.needle(needleId),
          availableQuantity: availableQuantity,
        );
      case ResyncWithServer():
        notice = const FlowNotice(
          AppStrings.exchangeResynced,
          FlowNoticeKind.info,
        );
      case AwaitConfirmation():
        break;
      case ExchangeGone():
        await _forgetRecord();
        _record = null;
        _startFailed(
          const FlowNotice(AppStrings.exchangeGone, FlowNoticeKind.warning),
        );
        return;
      case MasterDataStale():
        await ref.read(masterDataRefresherProvider).refresh();
        await _loadCatalog();
        if (!ref.mounted) return;
        state = state.copyWith(oldNeedle: null);
        notice = const FlowNotice(
          AppStrings.typeUnavailable,
          FlowNoticeKind.warning,
        );
      case NoApproverAvailable():
        notice = const FlowNotice(AppStrings.noApprover, FlowNoticeKind.error);
      case NoStorageMapping():
        notice = const FlowNotice(
          AppStrings.noStorageMapping,
          FlowNoticeKind.error,
        );
      case OperatorRejected() ||
          TransientFailure() ||
          HandledGlobally() ||
          ShowError():
        notice = FlowNotice(
          error.userMessage,
          FlowNoticeKind.error,
          title: AppStrings.syncRejectedTitle,
        );
    }
    await _reloadLocal(notice: notice);
    if (ref.mounted && stockProblem != null) {
      state = state.copyWith(stockProblem: stockProblem);
    }
  }

  static ExchangeCommand _commandFor(SyncCommandType type) => switch (type) {
    SyncCommandType.createExchange => ExchangeCommand.create,
    SyncCommandType.assignOperator => ExchangeCommand.identifyOperator,
    SyncCommandType.selectExchangeType => ExchangeCommand.selectType,
    SyncCommandType.fragmentValidation => ExchangeCommand.recordFragment,
    SyncCommandType.selectNewNeedle => ExchangeCommand.selectNewNeedle,
    SyncCommandType.issueNeedle => ExchangeCommand.issue,
    SyncCommandType.storeUsedNeedle => ExchangeCommand.storeUsedNeedle,
    SyncCommandType.completeExchange => ExchangeCommand.complete,
    SyncCommandType.cancelExchange => ExchangeCommand.cancel,
  };

  /// The server does not know the exchange any more: drop it locally.
  Future<void> _forgetRecord() async {
    final record = _record;
    if (record == null) return;
    await _queue.deleteFor(record.clientTransactionId);
    await _store.forget(record.clientTransactionId);
    await _evidence.discardAll(record.clientTransactionId);
  }

  /// Home's stock and history cards read the server again.
  void _refreshHome() {
    ref
      ..invalidate(trolleyStockProvider)
      ..invalidate(trolleyStockControllerProvider)
      ..invalidate(todayExchangeCountProvider);
  }

  // -------------------------------------------------------------------------
  // Queued steps (everything after the operator)
  // -------------------------------------------------------------------------

  /// Puts one step in the queue. Online it is sent right away and the wizard
  /// waits for the answer; offline — or when the send fails for a technical
  /// reason — the step stays queued, the wizard moves on and says so.
  Future<void> _queueStep(
    SyncCommandType type,
    Map<String, Object?> payload, {
    FlowNotice? successNotice,
  }) async {
    final record = _record;
    if (state.busy || record == null || state.exchange == null) return;
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    final ctx = record.clientTransactionId;
    final command = await _queue.enqueue(
      clientTransactionId: ctx,
      type: type,
      payload: payload,
      occurredAt: DateTime.now(),
    );
    if (type.closesExchange) await _store.markClosed(ctx);
    if (!ref.mounted) return;

    if (!state.offline) {
      await ref.read(syncControllerProvider.notifier).syncNow();
      if (!ref.mounted) return;
    }
    final after = await _queue.byId(command.commandId);
    if (!ref.mounted) return;
    FlowNotice? notice;
    var offerSync = false;
    if (after?.status == SyncCommandStatus.accepted) {
      notice = successNotice;
      if (type == SyncCommandType.issueNeedle) _refreshHome();
    } else if (after != null && after.isQueued) {
      notice = FlowNotice(
        state.offline ? AppStrings.savedOffline : AppStrings.savedNotSent,
        FlowNoticeKind.warning,
        title: AppStrings.pendingSyncTitle,
      );
      offerSync = !state.offline;
      _retryAction = _syncAndReload;
    }
    await _reloadLocal(notice: notice);
    if (ref.mounted && offerSync && state.notice == notice) {
      state = state.copyWith(canRetry: true);
    }
  }

  /// "COBA LAGI" / "SINKRONKAN SEKARANG" for queued steps.
  Future<void> _syncAndReload() async {
    if (state.busy) return;
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    await ref.read(syncControllerProvider.notifier).syncNow(manual: true);
    if (!ref.mounted) return;
    await _reloadLocal();
  }

  /// "SINKRONKAN SEKARANG" on the waiting-to-sync screen.
  Future<void> syncNow() => _syncAndReload();

  // -------------------------------------------------------------------------
  // HTTP command runner (operator only) and error routing
  // -------------------------------------------------------------------------

  Future<void> _command(
    ExchangeCommand command,
    String action,
    Map<String, Object?> body,
    Future<CommandResult<ExchangeSnapshot>> Function(String key) send, {
    FlowNotice? successNotice,
    FutureOr<void> Function(ExchangeSnapshot exchange)? onSuccess,
  }) async {
    if (state.busy) return;
    final exchange = state.exchange;
    if (exchange == null) return;
    Future<void> run() => _command(
      command,
      action,
      body,
      send,
      successNotice: successNotice,
      onSuccess: onSuccess,
    );
    _retryAction = run;
    state = state.copyWith(busy: true, notice: null, canRetry: false);

    final scope = 'POST /exchanges/${exchange.id}/$action';
    final key = _attempts.keyFor(scope, body);
    final result = await send(key);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        _attempts.settle(scope, null);
        await onSuccess?.call(value);
        if (!ref.mounted) return;
        await _apply(value, notice: successNotice);
      case CommandFailed(:final error):
        _attempts.settle(scope, error);
        await _handleError(command, error);
    }
  }

  /// Failures of the HTTP calls (operator lookup/confirm, evidence upload,
  /// reads).
  Future<void> _handleError(ExchangeCommand command, AppError error) async {
    AppLogger.warning('exchange', '${command.name} failed: $error');
    final route = routeExchangeError(command, error);
    switch (route) {
      case TransientFailure():
        state = state.copyWith(
          busy: false,
          notice: FlowNotice.error(error),
          canRetry: true,
        );
      case ResyncWithServer():
        await _resync(
          const FlowNotice(AppStrings.exchangeResynced, FlowNoticeKind.info),
        );
      case AwaitConfirmation():
        await _resync(null);
      case StockUnavailable(:final availableQuantity):
        state = state.copyWith(
          busy: false,
          stockProblem: StockProblem(
            needle: state.newNeedleChoice,
            availableQuantity: availableQuantity,
          ),
        );
      case OperatorRejected():
        state = state.copyWith(
          busy: false,
          operatorCandidate: null,
          step: state.exchange == null
              ? state.step
              : ExchangeStepMapper.stepFor(state.exchange!),
          notice: FlowNotice(
            '${AppStrings.rfidRejected} (${error.userMessage})',
            FlowNoticeKind.error,
            title: AppStrings.rfidRejectedTitle,
          ),
        );
      case ExchangeGone():
        await _forgetRecord();
        _record = null;
        _startFailed(
          const FlowNotice(AppStrings.exchangeGone, FlowNoticeKind.warning),
        );
      case MasterDataStale():
        await ref.read(masterDataRefresherProvider).refresh();
        await _loadCatalog();
        if (!ref.mounted) return;
        state = state.copyWith(
          busy: false,
          oldNeedle: null,
          notice: const FlowNotice(
            AppStrings.typeUnavailable,
            FlowNoticeKind.warning,
          ),
        );
      case NoApproverAvailable():
        state = state.copyWith(
          busy: false,
          notice: const FlowNotice(AppStrings.noApprover, FlowNoticeKind.error),
        );
      case NoStorageMapping():
        state = state.copyWith(
          busy: false,
          notice: const FlowNotice(
            AppStrings.noStorageMapping,
            FlowNoticeKind.error,
          ),
        );
      case HandledGlobally() || ShowError():
        state = state.copyWith(busy: false, notice: FlowNotice.error(error));
    }
  }

  /// Re-reads the authoritative exchange (online) and shows its step; offline
  /// shows the step of what the tablet holds.
  Future<void> _resync(FlowNotice? notice) async {
    final exchange = state.serverExchange ?? state.exchange;
    if (exchange == null) {
      state = state.copyWith(busy: false);
      return;
    }
    if (state.offline) {
      await _reloadLocal(notice: notice);
      return;
    }
    final result = await _exchanges.fetch(exchange.id);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        await _apply(value, notice: notice);
      case CommandFailed(:final error):
        state = state.copyWith(
          busy: false,
          notice: FlowNotice.error(error),
          canRetry: error.isRetryable,
        );
        _retryAction = refresh;
    }
  }

  /// "COBA LAGI": resend the last HTTP attempt (same body → same key), or
  /// sync the queued steps now.
  Future<void> retry() async {
    final action = _retryAction;
    if (action == null || state.busy) return;
    await action();
  }

  /// "MUAT ULANG" / manual re-read.
  Future<void> refresh() async {
    if (state.busy) return;
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    await _resync(null);
  }

  void dismissNotice() => state = state.copyWith(notice: null);

  // -------------------------------------------------------------------------
  // Operator (FR-MOB-004, MG-6: online only)
  // -------------------------------------------------------------------------

  Future<void> lookupOperator(String rfidUid) async {
    if (state.busy || state.step != ExchangeFlowStep.scanOperator) return;
    if (state.offline) {
      state = state.copyWith(notice: _rfidOfflineNotice);
      return;
    }
    _retryAction = () => lookupOperator(rfidUid);
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    final outcome = await ref.read(rfidRepositoryProvider).lookup(rfidUid);
    if (!ref.mounted) return;
    switch (outcome) {
      case OperatorFound(:final operator):
        state = state.copyWith(
          busy: false,
          operatorCandidate: operator,
          step: ExchangeFlowStep.confirmOperator,
        );
      case OperatorLookupFailed(:final error):
        await _handleError(ExchangeCommand.lookupOperator, error);
    }
  }

  static const _rfidOfflineNotice = FlowNotice(
    AppStrings.rfidOffline,
    FlowNoticeKind.warning,
    title: AppStrings.rfidOfflineTitle,
  );

  void rescanOperator() => state = state.copyWith(
    operatorCandidate: null,
    notice: null,
    step: ExchangeFlowStep.scanOperator,
  );

  Future<void> confirmOperator() async {
    final candidate = state.operatorCandidate;
    final exchange = state.exchange;
    if (candidate == null || exchange == null) return;
    if (state.offline) {
      // Identifying the operator stays online-only (MG-6).
      state = state.copyWith(notice: _rfidOfflineNotice);
      return;
    }
    final identity = OperatorIdentity(
      employeeId: candidate.employeeId,
      employeeNumber: candidate.employeeNumber,
      name: candidate.name,
    );
    await _command(
      ExchangeCommand.identifyOperator,
      'operator',
      {'rfidUid': candidate.rfidUid},
      (key) => _exchanges.identifyOperator(
        exchange.id,
        rfidUid: candidate.rfidUid,
        idempotencyKey: key,
      ),
      onSuccess: (_) async {
        final record = _record;
        if (record != null) {
          await _store.recordOperator(record.clientTransactionId, identity);
        }
        if (ref.mounted) state = state.copyWith(operator: identity);
      },
    );
  }

  // -------------------------------------------------------------------------
  // Old needle + exchange type (FR-MOB-005/006 — one SELECT_EXCHANGE_TYPE)
  // -------------------------------------------------------------------------

  void chooseOldNeedle(NeedleType needle) {
    if (state.exchange?.state != ExchangeState.operatorIdentified) return;
    state = state.copyWith(
      oldNeedle: needle,
      notice: null,
      step: ExchangeFlowStep.exchangeType,
    );
  }

  void changeOldNeedle() => state = state.copyWith(
    oldNeedle: null,
    notice: null,
    step: ExchangeFlowStep.oldNeedleType,
  );

  Future<void> selectExchangeType(ExchangeType type) async {
    final needle = state.oldNeedle;
    if (needle == null) return;
    await _queueStep(SyncCommandType.selectExchangeType, {
      'exchangeTypeId': type.id,
      'oldNeedleTypeId': needle.id,
    });
  }

  // -------------------------------------------------------------------------
  // Fragment + confirmation (FR-MOB-007/008)
  // -------------------------------------------------------------------------

  Future<void> recordFragment(FragmentStatus status) => _queueStep(
    SyncCommandType.fragmentValidation,
    {'fragmentStatus': status.wire},
  );

  /// "CEK STATUS" and the poll. While the fragment result is still queued
  /// the confirmation does not exist yet: sync (the pull brings the
  /// decision). Otherwise `GET /confirmations/{id}`; when the exchange itself
  /// moved (e.g. cancelled by an admin), re-read it.
  Future<void> checkConfirmation({bool silent = false}) async {
    final exchange = state.serverExchange;
    final record = _record;
    if (exchange == null || record == null || state.busy) return;
    if (state.offline) {
      if (!silent) {
        state = state.copyWith(
          notice: const FlowNotice(
            AppStrings.awaitingOffline,
            FlowNoticeKind.warning,
          ),
        );
      }
      return;
    }
    final id = exchange.confirmationId;
    final fragmentQueued = state.projection?.fragmentPending ?? false;
    if (fragmentQueued || id == null) {
      if (silent) {
        await ref.read(syncControllerProvider.notifier).syncNow();
        if (ref.mounted && !state.busy) await _reloadLocal(keepNotice: true);
      } else {
        await _syncAndReload();
      }
      return;
    }
    if (!silent) state = state.copyWith(busy: true, notice: null);
    final result = await _exchanges.fetchConfirmation(id);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        await _store.recordConfirmation(
          record.clientTransactionId,
          value.status,
        );
        if (!ref.mounted) return;
        state = state.copyWith(confirmation: value);
        if (value.exchangeState != null &&
            value.exchangeState != exchange.state) {
          state = state.copyWith(busy: true);
          await _resync(null);
          return;
        }
        await _reloadLocal();
      case CommandFailed(:final error):
        if (!silent) {
          state = state.copyWith(busy: false, notice: FlowNotice.error(error));
        }
    }
  }

  void _syncPolling() {
    final waiting = state.step == ExchangeFlowStep.awaitingConfirmation;
    if (!waiting) {
      _poll?.cancel();
      _poll = null;
      return;
    }
    if (_poll != null) return;
    final interval = ref.read(confirmationPollIntervalProvider);
    _poll = Timer.periodic(interval, (_) {
      if (!ref.mounted) return;
      if (!state.busy && !state.offline) {
        unawaited(checkConfirmation(silent: true));
      }
    });
  }

  // -------------------------------------------------------------------------
  // Evidence (FR-MOB-009, MG-7)
  // -------------------------------------------------------------------------

  Future<void> _loadEvidenceProgress() async {
    final exchange = state.exchange;
    final record = _record;
    if (exchange == null || record == null) return;
    final evidence = _evidence;
    final uploaded = state.offline || state.pendingSync
        ? null
        : await evidence.uploadedTypes(exchange.id);
    final local = await evidence.pending(record.clientTransactionId);
    if (!ref.mounted) return;
    if (uploaded case CommandOk(:final value)) {
      _serverEvidence
        ..clear()
        ..addAll(value);
    }
    final known = {
      ..._serverEvidence,
      for (final p in local)
        if (p.status == LocalEvidenceStatus.queued) p.type,
    };
    // Server set unknown (offline): ask for the mandatory set minus what
    // waits locally — a duplicate upload is harmless.
    final outstanding = EvidencePolicy.missing(exchange.fragmentStatus, known);
    // A photo kept from before the app was killed is offered for upload
    // first — same file, same key.
    LocalEvidence? pendingPhoto;
    for (final photo in local) {
      if (photo.status != LocalEvidenceStatus.queued &&
          outstanding.contains(photo.type)) {
        pendingPhoto = photo;
        break;
      }
    }
    for (final photo in local) {
      if (photo.status != LocalEvidenceStatus.queued &&
          !outstanding.contains(photo.type)) {
        await evidence.discard(photo);
      }
    }
    if (!ref.mounted) return;
    state = state.copyWith(
      evidence: EvidenceProgress(
        loaded: true,
        outstanding: outstanding,
        pendingPhoto: pendingPhoto,
      ),
    );
  }

  Future<void> photoCaptured(CapturedPhoto photo) async {
    final record = _record;
    final type = state.evidence.current;
    if (record == null || type == null || state.busy) return;
    final kept = await _evidence.keep(
      clientTransactionId: record.clientTransactionId,
      type: type,
      photo: photo,
    );
    if (!ref.mounted) return;
    state = state.copyWith(
      notice: null,
      canRetry: false,
      evidence: EvidenceProgress(
        loaded: true,
        outstanding: state.evidence.outstanding,
        pendingPhoto: kept,
      ),
    );
  }

  Future<void> retakePhoto() async {
    final photo = state.evidence.pendingPhoto;
    if (photo == null || state.busy) return;
    await _evidence.discard(photo);
    if (!ref.mounted) return;
    state = state.copyWith(
      notice: null,
      canRetry: false,
      evidence: EvidenceProgress(
        loaded: true,
        outstanding: state.evidence.outstanding,
      ),
    );
  }

  /// "GUNAKAN FOTO". Online with nothing queued before it: upload now with
  /// the photo's own key (the local copy is deleted only after the backend
  /// confirmed it). Otherwise — offline, earlier steps still queued, or the
  /// upload failed for a technical reason — the photo waits on the tablet
  /// and the sync engine uploads it before the steps that need it (MG-7).
  Future<void> usePhoto() async {
    final photo = state.evidence.pendingPhoto;
    final exchange = state.exchange;
    if (photo == null || exchange == null || state.busy) return;
    _retryAction = usePhoto;
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    if (state.offline || state.pendingSync) {
      await _keepPhotoForSync(photo);
      return;
    }
    final result = await _evidence.upload(exchange.id, photo);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        _serverEvidence.add(photo.type);
        if (value.outstanding.isEmpty ||
            value.exchangeState == ExchangeState.evidenceCaptured) {
          state = state.copyWith(
            evidence: const EvidenceProgress(loaded: true),
          );
          await _resync(null);
        } else {
          state = state.copyWith(
            busy: false,
            evidence: EvidenceProgress(
              loaded: true,
              outstanding: value.outstanding,
            ),
          );
        }
      case CommandFailed(:final error) when error.isRetryable:
        await _keepPhotoForSync(photo);
      case CommandFailed(:final error):
        await _handleError(ExchangeCommand.uploadEvidence, error);
    }
  }

  Future<void> _keepPhotoForSync(LocalEvidence photo) async {
    await _evidence.markQueued(photo);
    if (!ref.mounted) return;
    final outstanding = [
      for (final t in state.evidence.outstanding)
        if (t != photo.type) t,
    ];
    state = state.copyWith(
      evidence: EvidenceProgress(loaded: true, outstanding: outstanding),
    );
    await _reloadLocal(
      notice: const FlowNotice(
        AppStrings.photoSavedOffline,
        FlowNoticeKind.warning,
        title: AppStrings.pendingSyncTitle,
      ),
    );
    if (ref.mounted && state.step == ExchangeFlowStep.evidence) {
      await _loadEvidenceProgress();
    }
  }

  // -------------------------------------------------------------------------
  // New needle, issue, storage, complete (FR-MOB-010..013)
  // -------------------------------------------------------------------------

  void chooseNewNeedleType(NeedleType needle) => state = state.copyWith(
    newNeedleChoice: needle,
    stockProblem: null,
    notice: null,
  );

  Future<void> selectNewNeedle() async {
    final needle = state.newNeedleChoice;
    if (needle == null) return;
    state = state.copyWith(stockProblem: null);
    await _queueStep(SyncCommandType.selectNewNeedle, {
      'needleTypeId': needle.id,
    });
  }

  /// `quantity` is omitted: the backend defaults to 1 and the PIC may not
  /// change it (Doc 07 §24). Final only when the backend answers (Locked
  /// stock policy).
  Future<void> issueNeedle() async {
    state = state.copyWith(stockProblem: null);
    await _queueStep(
      SyncCommandType.issueNeedle,
      const {},
      successNotice: const FlowNotice(
        AppStrings.issueDone,
        FlowNoticeKind.success,
      ),
    );
  }

  Future<void> storeUsedNeedle() =>
      _queueStep(SyncCommandType.storeUsedNeedle, const {});

  Future<void> complete() =>
      _queueStep(SyncCommandType.completeExchange, const {});

  // -------------------------------------------------------------------------
  // Cancel (Doc 07 §29) — any non-terminal state, reason mandatory
  // -------------------------------------------------------------------------

  Future<void> cancel(String reason) async {
    final trimmed = reason.trim();
    if (trimmed.isEmpty || state.busy) return;
    final exchange = state.exchange;
    if (exchange == null) {
      await _cancelBeforeCreateAnswered(trimmed);
      return;
    }
    if (exchange.state.isTerminal) return;
    await _queueStep(SyncCommandType.cancelExchange, {'reason': trimmed});
  }

  /// The create never answered: resend it (same key) to learn whether the
  /// server has the exchange, then cancel that one; nothing is left behind.
  Future<void> _cancelBeforeCreateAnswered(String reason) async {
    final record = _record;
    if (record == null || _device == null) return;
    state = state.copyWith(busy: true, notice: null);
    final created = await _sendCreate(record);
    if (!ref.mounted) return;
    switch (created) {
      case CommandOk(:final value):
        await _store.recordServerState(record.clientTransactionId, value);
        state = state.copyWith(exchange: value, busy: false);
        await cancel(reason);
      case CommandFailed(:final error) when error.isRetryable:
        state = state.copyWith(
          busy: false,
          notice: FlowNotice.error(error),
          canRetry: false,
        );
      case CommandFailed():
        // The backend refused the create outright: nothing exists there.
        await _forgetRecord();
        if (ref.mounted) {
          state = state.copyWith(busy: false, step: ExchangeFlowStep.cancelled);
        }
    }
  }
}

final exchangeFlowControllerProvider =
    NotifierProvider.autoDispose<ExchangeFlowController, ExchangeFlowState>(
      ExchangeFlowController.new,
    );

/// Which exchange the wizard should open next, when not the one it would
/// resume by itself — set by the Pending Sync screen ("BUKA TRANSAKSI").
class ExchangeOpenRequest extends Notifier<String?> {
  @override
  String? build() => null;

  void open(String clientTransactionId) => state = clientTransactionId;

  /// Returns the request once and clears it.
  String? take() {
    final requested = state;
    state = null;
    return requested;
  }
}

final exchangeOpenRequestProvider =
    NotifierProvider<ExchangeOpenRequest, String?>(ExchangeOpenRequest.new);

/// This device's unfinished exchange (local pointer only — the flow re-reads
/// the server before showing anything). Drives Home's auto-resume.
final pendingExchangeProvider =
    FutureProvider.autoDispose<LocalExchangeRecord?>((ref) async {
      final validation = ref.watch(deviceValidationControllerProvider);
      if (validation is! ValidationPassed) return null;
      return ref
          .watch(activeExchangeStoreProvider)
          .current(validation.context.device.id);
    });

/// Home opens an unfinished exchange once per app run (after a restart),
/// never again after the PIC chose "SIMPAN & KELUAR".
class ExchangeAutoResume extends Notifier<bool> {
  @override
  bool build() => false;

  /// Returns `true` the first time only.
  bool claim() {
    if (state) return false;
    state = true;
    return true;
  }
}

final exchangeAutoResumeProvider = NotifierProvider<ExchangeAutoResume, bool>(
  ExchangeAutoResume.new,
);
