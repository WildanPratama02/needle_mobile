import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';

/// The cached catalogues the wizard picks from (bootstrap master data,
/// active rows only — Doc 15 §4).
final class ExchangeCatalog {
  const ExchangeCatalog({
    this.needleTypes = const [],
    this.exchangeTypes = const [],
    this.storageMappings = const [],
  });

  final List<NeedleType> needleTypes;
  final List<ExchangeType> exchangeTypes;
  final List<StorageMapping> storageMappings;

  NeedleType? needle(String? id) {
    for (final n in needleTypes) {
      if (n.id == id) return n;
    }
    return null;
  }

  ExchangeType? exchangeType(String? id) {
    for (final t in exchangeTypes) {
      if (t.id == id) return t;
    }
    return null;
  }

  /// Where the used needle of [exchangeTypeId] goes on this trolley. The
  /// backend resolves it again on `/store-used-needle`; this is the
  /// instruction shown to the PIC (Doc 07 §26).
  StorageMapping? storageFor(String? exchangeTypeId) {
    for (final m in storageMappings) {
      if (m.exchangeTypeId == exchangeTypeId) return m;
    }
    return null;
  }
}

enum FlowNoticeKind { info, success, warning, error }

/// A banner above the step body.
final class FlowNotice {
  const FlowNotice(this.text, this.kind, {this.title});

  factory FlowNotice.error(AppError error) =>
      FlowNotice(error.userMessage, FlowNoticeKind.error);

  final String? title;
  final String text;
  final FlowNoticeKind kind;
}

/// Evidence progress for the current exchange.
final class EvidenceProgress {
  const EvidenceProgress({
    this.loaded = false,
    this.outstanding = const [],
    this.pendingPhoto,
  });

  /// `false` until the uploaded set was read from the server.
  final bool loaded;

  /// Mandatory types still missing (server answer wins over the local
  /// policy mirror).
  final List<EvidenceType> outstanding;

  /// Captured and kept locally, waiting for "GUNAKAN FOTO" / upload.
  final LocalEvidence? pendingPhoto;

  EvidenceType? get current => pendingPhoto?.type ?? outstanding.firstOrNull;
}

/// `INVENTORY_INSUFFICIENT_STOCK` details (Doc 07 §24, Doc 17 §23).
final class StockProblem {
  const StockProblem({required this.needle, this.availableQuantity});

  final NeedleType? needle;
  final int? availableQuantity;
}

const _unset = Object();

final class ExchangeFlowState {
  const ExchangeFlowState({
    this.step = ExchangeFlowStep.starting,
    this.exchange,
    this.confirmation,
    this.operatorCandidate,
    this.operator,
    this.oldNeedle,
    this.newNeedleChoice,
    this.catalog = const ExchangeCatalog(),
    this.evidence = const EvidenceProgress(),
    this.busy = false,
    this.notice,
    this.canRetry = false,
    this.stockProblem,
    this.offline = false,
    this.startFailed = false,
    this.cancelledAfterIssue = false,
    this.approvedNotice = false,
  });

  final ExchangeFlowStep step;

  /// The server record — the only source of the step (via
  /// `ExchangeStepMapper`).
  final ExchangeSnapshot? exchange;
  final ConfirmationSnapshot? confirmation;

  /// RFID lookup result not yet sent with `/operator`.
  final RfidOperator? operatorCandidate;

  /// The confirmed operator, for summaries (MG-4: not on the exchange row).
  final OperatorIdentity? operator;

  /// Old needle picked but not yet sent (`/type` needs the exchange type
  /// too).
  final NeedleType? oldNeedle;

  /// Selection on the new-needle screen (defaults to the old needle).
  final NeedleType? newNeedleChoice;
  final ExchangeCatalog catalog;
  final EvidenceProgress evidence;

  /// A request is running: every action is disabled (commands run strictly
  /// one after another, Doc 15 §12).
  final bool busy;
  final FlowNotice? notice;

  /// The last failure was transient: "COBA LAGI" resends the same attempt
  /// (same `Idempotency-Key`).
  final bool canRetry;
  final StockProblem? stockProblem;
  final bool offline;

  /// Opening/resuming failed; the start screen shows the notice.
  final bool startFailed;

  /// Cancelled from `NEEDLE_ISSUED` / `USED_NEEDLE_STORED`: the backend
  /// reversed the stock.
  final bool cancelledAfterIssue;

  /// Show "KONFIRMASI DISETUJUI" above the photo step.
  final bool approvedNotice;

  bool get isBroken => exchange?.isBroken ?? false;

  ExchangeFlowState copyWith({
    ExchangeFlowStep? step,
    Object? exchange = _unset,
    Object? confirmation = _unset,
    Object? operatorCandidate = _unset,
    Object? operator = _unset,
    Object? oldNeedle = _unset,
    Object? newNeedleChoice = _unset,
    ExchangeCatalog? catalog,
    EvidenceProgress? evidence,
    bool? busy,
    Object? notice = _unset,
    bool? canRetry,
    Object? stockProblem = _unset,
    bool? offline,
    bool? startFailed,
    bool? cancelledAfterIssue,
    bool? approvedNotice,
  }) => ExchangeFlowState(
    step: step ?? this.step,
    exchange: exchange == _unset
        ? this.exchange
        : exchange as ExchangeSnapshot?,
    confirmation: confirmation == _unset
        ? this.confirmation
        : confirmation as ConfirmationSnapshot?,
    operatorCandidate: operatorCandidate == _unset
        ? this.operatorCandidate
        : operatorCandidate as RfidOperator?,
    operator: operator == _unset
        ? this.operator
        : operator as OperatorIdentity?,
    oldNeedle: oldNeedle == _unset ? this.oldNeedle : oldNeedle as NeedleType?,
    newNeedleChoice: newNeedleChoice == _unset
        ? this.newNeedleChoice
        : newNeedleChoice as NeedleType?,
    catalog: catalog ?? this.catalog,
    evidence: evidence ?? this.evidence,
    busy: busy ?? this.busy,
    notice: notice == _unset ? this.notice : notice as FlowNotice?,
    canRetry: canRetry ?? this.canRetry,
    stockProblem: stockProblem == _unset
        ? this.stockProblem
        : stockProblem as StockProblem?,
    offline: offline ?? this.offline,
    startFailed: startFailed ?? this.startFailed,
    cancelledAfterIssue: cancelledAfterIssue ?? this.cancelledAfterIssue,
    approvedNotice: approvedNotice ?? this.approvedNotice,
  );
}
