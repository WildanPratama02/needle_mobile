import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/idempotency_attempts.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_error_route.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_state.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_providers.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:uuid/uuid.dart';

/// Drives the online exchange wizard (Docs/21 phases 5–8).
///
/// Rules it enforces:
/// - the step always comes from the latest server answer through
///   [ExchangeStepMapper] (Doc 17 §46) — never from a button sequence;
/// - commands run one at a time ([ExchangeFlowState.busy]), in the Doc 15 §12
///   order the backend state machine dictates;
/// - every POST carries an `Idempotency-Key` chosen by
///   [IdempotencyAttempts]; automatic retry is the repository's Doc 07 §41
///   whitelist only;
/// - nothing is shown as issued/completed until the backend says so
///   (ADR-004).
class ExchangeFlowController extends Notifier<ExchangeFlowState> {
  final _attempts = IdempotencyAttempts();
  final _uuid = const Uuid();
  Timer? _poll;
  Future<void> Function()? _retryAction;

  /// The local pointer of the exchange being worked on.
  LocalExchangeRecord? _record;
  DeviceContextSnapshot? _device;

  ExchangeRepository get _exchanges => ref.read(exchangeRepositoryProvider);
  ActiveExchangeStore get _store => ref.read(activeExchangeStoreProvider);

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
    final offline =
        ref.read(connectivityStatusProvider).value ==
        ConnectivityStatus.offline;
    unawaited(Future.microtask(start));
    return ExchangeFlowState(offline: offline, busy: true);
  }

  // -------------------------------------------------------------------------
  // Start / resume
  // -------------------------------------------------------------------------

  /// Opens a new exchange, or resumes this device's unfinished one at the
  /// server's current state.
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

    if (state.offline) {
      _startFailed(
        const FlowNotice(
          AppStrings.exchangeNeedsConnection,
          FlowNoticeKind.warning,
        ),
        retry: true,
      );
      return;
    }

    // Phase 5: bring the catalogues up to date (versions sent, unchanged
    // collections come back null and are kept). A failure keeps the cache.
    await ref.read(masterDataRefresherProvider).refresh();
    if (!ref.mounted) return;
    await _loadCatalog();
    if (!ref.mounted) return;

    final existing = await _store.current(deviceId);
    if (!ref.mounted) return;
    final CommandResult<ExchangeSnapshot> result;
    if (existing != null) {
      _record = existing;
      state = state.copyWith(operator: existing.operator);
      final serverId = existing.serverExchangeId;
      result = serverId == null
          ? await _sendCreate(existing)
          : await _exchanges.fetch(serverId);
    } else {
      final record = LocalExchangeRecord(
        clientTransactionId: _uuid.v4(),
        createIdempotencyKey: _uuid.v4(),
        deviceId: deviceId,
      );
      // Persisted before sending, so a kill during the request resumes this
      // same create (same clientTransactionId and key → same exchange).
      await _store.begin(record);
      _record = record;
      result = await _sendCreate(record);
    }
    if (!ref.mounted) return;

    switch (result) {
      case CommandOk(:final value):
        await _apply(value);
      case CommandFailed(:final error):
        final route = routeExchangeError(ExchangeCommand.create, error);
        if (route is ExchangeGone) {
          await _forgetRecord();
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
  // Applying a server answer
  // -------------------------------------------------------------------------

  /// The single path by which a server answer changes the screen.
  Future<void> _apply(ExchangeSnapshot exchange, {FlowNotice? notice}) async {
    final record = _record;
    if (record != null) {
      await _store.recordServerState(record.clientTransactionId, exchange);
    }
    ConfirmationSnapshot? confirmation = state.confirmation;
    if (exchange.state == ExchangeState.confirmationPending &&
        exchange.confirmationId != null) {
      final read = await _exchanges.fetchConfirmation(exchange.confirmationId!);
      if (read is CommandOk<ConfirmationSnapshot>) confirmation = read.value;
    } else if (exchange.confirmationId == null) {
      confirmation = null;
    }
    if (!ref.mounted) return;

    if (exchange.state.isTerminal) {
      await _forgetRecord();
      _refreshHome();
    }

    final keepCandidate = exchange.state == ExchangeState.created;
    final keepOldNeedle = exchange.state == ExchangeState.operatorIdentified;
    final step = ExchangeStepMapper.stepFor(
      exchange,
      confirmationStatus: confirmation?.status,
      hasOperatorCandidate: keepCandidate && state.operatorCandidate != null,
      hasOldNeedleChoice: keepOldNeedle && state.oldNeedle != null,
    );
    final enteringEvidence =
        step == ExchangeFlowStep.evidence &&
        state.step != ExchangeFlowStep.evidence;
    state = state.copyWith(
      step: step,
      exchange: exchange,
      confirmation: confirmation,
      operatorCandidate: keepCandidate ? state.operatorCandidate : null,
      oldNeedle: keepOldNeedle ? state.oldNeedle : null,
      newNeedleChoice: step == ExchangeFlowStep.newNeedle
          ? (state.newNeedleChoice ??
                state.catalog.needle(exchange.oldNeedleTypeId))
          : state.newNeedleChoice,
      evidence: enteringEvidence ? const EvidenceProgress() : null,
      busy: false,
      notice: notice,
      canRetry: false,
      startFailed: false,
      approvedNotice:
          step == ExchangeFlowStep.evidence &&
          confirmation?.status == ConfirmationStatus.approved,
    );
    _syncPolling();
    if (enteringEvidence) await _loadEvidenceProgress();
  }

  Future<void> _forgetRecord() async {
    final record = _record;
    if (record == null) return;
    await _store.finish(record.clientTransactionId);
    await ref
        .read(evidenceRepositoryProvider)
        .discardAll(record.clientTransactionId);
  }

  /// Home's stock and history cards read the server again.
  void _refreshHome() {
    ref
      ..invalidate(trolleyStockProvider)
      ..invalidate(todayExchangeCountProvider);
  }

  // -------------------------------------------------------------------------
  // Command runner
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
            needle: command == ExchangeCommand.issue
                ? state.catalog.needle(state.exchange?.newNeedleTypeId)
                : state.newNeedleChoice,
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
          step: state.exchange == null
              ? state.step
              : ExchangeStepMapper.stepFor(state.exchange!),
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

  /// Re-reads the authoritative exchange and shows its step.
  Future<void> _resync(FlowNotice? notice) async {
    final exchange = state.exchange;
    if (exchange == null) {
      state = state.copyWith(busy: false);
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

  /// "COBA LAGI": resend the last attempt (same body → same key).
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
      state = state.copyWith(
        notice: const FlowNotice(
          AppStrings.rfidOffline,
          FlowNoticeKind.warning,
          title: AppStrings.rfidOfflineTitle,
        ),
      );
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

  void rescanOperator() => state = state.copyWith(
    operatorCandidate: null,
    notice: null,
    step: ExchangeFlowStep.scanOperator,
  );

  Future<void> confirmOperator() async {
    final candidate = state.operatorCandidate;
    final exchange = state.exchange;
    if (candidate == null || exchange == null) return;
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
  // Old needle + exchange type (FR-MOB-005/006 — one `/type` call)
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
    final exchange = state.exchange;
    if (needle == null || exchange == null) return;
    await _command(
      ExchangeCommand.selectType,
      'type',
      {'exchangeTypeId': type.id, 'oldNeedleTypeId': needle.id},
      (key) => _exchanges.selectType(
        exchange.id,
        exchangeTypeId: type.id,
        oldNeedleTypeId: needle.id,
        idempotencyKey: key,
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Fragment + confirmation (FR-MOB-007/008)
  // -------------------------------------------------------------------------

  Future<void> recordFragment(FragmentStatus status) async {
    final exchange = state.exchange;
    if (exchange == null) return;
    await _command(
      ExchangeCommand.recordFragment,
      'fragment',
      {'fragmentStatus': status.wire},
      (key) => _exchanges.recordFragment(
        exchange.id,
        fragmentStatus: status,
        idempotencyKey: key,
      ),
    );
  }

  /// "CEK STATUS" and the poll: `GET /confirmations/{id}`; when the exchange
  /// itself moved (e.g. cancelled by an admin), re-read it.
  Future<void> checkConfirmation({bool silent = false}) async {
    final exchange = state.exchange;
    final id = exchange?.confirmationId;
    if (exchange == null || id == null || state.busy) return;
    if (!silent) state = state.copyWith(busy: true, notice: null);
    final result = await _exchanges.fetchConfirmation(id);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
        if (value.exchangeState != null &&
            value.exchangeState != exchange.state) {
          state = state.copyWith(confirmation: value, busy: true);
          await _resync(null);
          return;
        }
        final step = ExchangeStepMapper.stepFor(
          exchange,
          confirmationStatus: value.status,
        );
        final enteringEvidence =
            step == ExchangeFlowStep.evidence &&
            state.step != ExchangeFlowStep.evidence;
        state = state.copyWith(
          confirmation: value,
          step: step,
          busy: false,
          approvedNotice: value.status == ConfirmationStatus.approved,
          evidence: enteringEvidence ? const EvidenceProgress() : null,
        );
        _syncPolling();
        if (enteringEvidence) await _loadEvidenceProgress();
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
    final evidence = ref.read(evidenceRepositoryProvider);
    final uploaded = await evidence.uploadedTypes(exchange.id);
    final local = await evidence.pending(record.clientTransactionId);
    if (!ref.mounted) return;
    final outstanding = switch (uploaded) {
      CommandOk(:final value) => EvidencePolicy.missing(
        exchange.fragmentStatus,
        value,
      ),
      // Unknown: ask for the full mandatory set (a duplicate is harmless).
      CommandFailed() => EvidencePolicy.required(exchange.fragmentStatus),
    };
    // A photo kept from before the app was killed is offered for upload
    // first — same file, same key.
    LocalEvidence? pendingPhoto;
    for (final photo in local) {
      if (outstanding.contains(photo.type)) {
        pendingPhoto = photo;
        break;
      }
    }
    for (final photo in local) {
      if (!outstanding.contains(photo.type)) await evidence.discard(photo);
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
    final kept = await ref
        .read(evidenceRepositoryProvider)
        .keep(
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
    await ref.read(evidenceRepositoryProvider).discard(photo);
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

  /// "GUNAKAN FOTO": upload with the photo's own key; the local copy is
  /// deleted only after the backend confirmed it.
  Future<void> usePhoto() async {
    final photo = state.evidence.pendingPhoto;
    final exchange = state.exchange;
    if (photo == null || exchange == null || state.busy) return;
    _retryAction = usePhoto;
    state = state.copyWith(busy: true, notice: null, canRetry: false);
    final result = await ref
        .read(evidenceRepositoryProvider)
        .upload(exchange.id, photo);
    if (!ref.mounted) return;
    switch (result) {
      case CommandOk(:final value):
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
      case CommandFailed(:final error):
        await _handleError(ExchangeCommand.uploadEvidence, error);
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
    final exchange = state.exchange;
    if (needle == null || exchange == null) return;
    state = state.copyWith(stockProblem: null);
    await _command(
      ExchangeCommand.selectNewNeedle,
      'new-needle',
      {'needleTypeId': needle.id},
      (key) => _exchanges.selectNewNeedle(
        exchange.id,
        needleTypeId: needle.id,
        idempotencyKey: key,
      ),
    );
  }

  Future<void> issueNeedle() async {
    final exchange = state.exchange;
    if (exchange == null) return;
    state = state.copyWith(stockProblem: null);
    await _command(
      ExchangeCommand.issue,
      'issue',
      const {},
      (key) => _exchanges.issue(exchange.id, idempotencyKey: key),
      successNotice: const FlowNotice(
        AppStrings.issueDone,
        FlowNoticeKind.success,
      ),
      onSuccess: (_) => _refreshHome(),
    );
  }

  Future<void> storeUsedNeedle() async {
    final exchange = state.exchange;
    if (exchange == null) return;
    await _command(
      ExchangeCommand.storeUsedNeedle,
      'store-used-needle',
      const {},
      (key) => _exchanges.storeUsedNeedle(exchange.id, idempotencyKey: key),
    );
  }

  Future<void> complete() async {
    final exchange = state.exchange;
    if (exchange == null) return;
    await _command(
      ExchangeCommand.complete,
      'complete',
      const {},
      (key) => _exchanges.complete(exchange.id, idempotencyKey: key),
    );
  }

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
    final issued = exchange.state.stockIssued;
    await _command(
      ExchangeCommand.cancel,
      'cancel',
      {'reason': trimmed},
      (key) =>
          _exchanges.cancel(exchange.id, reason: trimmed, idempotencyKey: key),
      onSuccess: (value) {
        if (ref.mounted) {
          state = state.copyWith(
            cancelledAfterIssue:
                issued && value.state == ExchangeState.cancelled,
          );
        }
      },
    );
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
