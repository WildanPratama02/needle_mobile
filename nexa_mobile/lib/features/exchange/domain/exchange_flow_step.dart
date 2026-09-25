import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// The wizard screens (Doc 07 §9–29, Doc 17 §8–26). One screen = one decision
/// = one primary action (Doc 07 §43).
enum ExchangeFlowStep {
  /// Opening a new exchange or reloading an interrupted one.
  starting,

  /// `CREATED`: tap the operator's RFID card (online only, MG-6).
  scanOperator,

  /// `CREATED` + a successful lookup: PIC confirms who tapped.
  confirmOperator,

  /// `OPERATOR_IDENTIFIED`: which needle type is being exchanged.
  oldNeedleType,

  /// `OPERATOR_IDENTIFIED` + old needle chosen: BROKEN / BENT / CHANGEOVER.
  /// `POST /type` carries both choices (contract matrix DRIFT row).
  exchangeType,

  /// `EXCHANGE_TYPE_SELECTED` of a BROKEN exchange: fragment FOUND/NOT_FOUND.
  fragmentCheck,

  /// `CONFIRMATION_PENDING`, confirmation `PENDING` (or not read yet).
  awaitingConfirmation,

  /// `CONFIRMATION_PENDING`, confirmation `REJECTED` / `EXPIRED`: blocked,
  /// only cancelling releases it (CONTEXT.md "Blocked").
  confirmationBlocked,

  /// Photo evidence: BENT/CHANGEOVER after the type, BROKEN after
  /// `FRAGMENT_CHECK` or an approved confirmation.
  evidence,

  /// `EVIDENCE_CAPTURED`: choose the replacement needle.
  newNeedle,

  /// `NEW_NEEDLE_SELECTED`: confirm and issue (stock moves on the backend).
  issue,

  /// `NEEDLE_ISSUED`: put the used needle in its storage hole.
  storeUsedNeedle,

  /// `USED_NEEDLE_STORED`: final summary, complete.
  complete,

  /// `COMPLETED` (from the backend only).
  done,

  /// `CANCELLED`.
  cancelled,

  /// A state the wizard has no forward action for (the transient
  /// `NEEDLE_SELECTED`): refresh or cancel only.
  stuck;

  bool get isTerminal => this == done || this == cancelled;
}

/// The ONE place where server Exchange State becomes a wizard step
/// (Doc 07 §28, Doc 17 §46 "UI must render from domain state"). Widgets and
/// the controller never branch on [ExchangeState] themselves.
///
/// Two steps have no server state of their own — the backend records the
/// operator and the old-needle choice only once the next screen is done — so
/// the local choices refine the server step:
/// - [hasOperatorCandidate]: an RFID lookup succeeded but `/operator` was not
///   sent yet → [ExchangeFlowStep.confirmOperator];
/// - [hasOldNeedleChoice]: the old needle is picked but `/type` was not sent
///   yet → [ExchangeFlowStep.exchangeType].
abstract final class ExchangeStepMapper {
  static ExchangeFlowStep stepFor(
    ExchangeSnapshot exchange, {
    ConfirmationStatus? confirmationStatus,
    bool hasOperatorCandidate = false,
    bool hasOldNeedleChoice = false,
  }) {
    return switch (exchange.state) {
      ExchangeState.created =>
        hasOperatorCandidate
            ? ExchangeFlowStep.confirmOperator
            : ExchangeFlowStep.scanOperator,
      ExchangeState.operatorIdentified =>
        hasOldNeedleChoice
            ? ExchangeFlowStep.exchangeType
            : ExchangeFlowStep.oldNeedleType,
      ExchangeState.needleSelected => ExchangeFlowStep.stuck,
      ExchangeState.exchangeTypeSelected =>
        exchange.isBroken
            ? ExchangeFlowStep.fragmentCheck
            : ExchangeFlowStep.evidence,
      ExchangeState.fragmentCheck => ExchangeFlowStep.evidence,
      ExchangeState.confirmationPending => switch (confirmationStatus) {
        ConfirmationStatus.approved => ExchangeFlowStep.evidence,
        ConfirmationStatus.rejected ||
        ConfirmationStatus.expired => ExchangeFlowStep.confirmationBlocked,
        ConfirmationStatus.pending ||
        null => ExchangeFlowStep.awaitingConfirmation,
      },
      ExchangeState.evidenceCaptured => ExchangeFlowStep.newNeedle,
      ExchangeState.newNeedleSelected => ExchangeFlowStep.issue,
      ExchangeState.needleIssued => ExchangeFlowStep.storeUsedNeedle,
      ExchangeState.usedNeedleStored => ExchangeFlowStep.complete,
      ExchangeState.completed => ExchangeFlowStep.done,
      ExchangeState.cancelled => ExchangeFlowStep.cancelled,
    };
  }

  /// The progress bar (Doc 17 §44): the fragment step only for BROKEN.
  static List<ExchangeProgressStage> stagesFor({required bool broken}) => [
    ExchangeProgressStage.operator,
    ExchangeProgressStage.oldNeedle,
    ExchangeProgressStage.exchangeType,
    if (broken) ExchangeProgressStage.fragment,
    ExchangeProgressStage.photo,
    ExchangeProgressStage.newNeedle,
    ExchangeProgressStage.issue,
    ExchangeProgressStage.store,
  ];

  static ExchangeProgressStage? stageOf(ExchangeFlowStep step) =>
      switch (step) {
        ExchangeFlowStep.starting => null,
        ExchangeFlowStep.scanOperator ||
        ExchangeFlowStep.confirmOperator => ExchangeProgressStage.operator,
        ExchangeFlowStep.oldNeedleType => ExchangeProgressStage.oldNeedle,
        ExchangeFlowStep.exchangeType => ExchangeProgressStage.exchangeType,
        ExchangeFlowStep.fragmentCheck ||
        ExchangeFlowStep.awaitingConfirmation ||
        ExchangeFlowStep.confirmationBlocked => ExchangeProgressStage.fragment,
        ExchangeFlowStep.evidence => ExchangeProgressStage.photo,
        ExchangeFlowStep.newNeedle => ExchangeProgressStage.newNeedle,
        ExchangeFlowStep.issue => ExchangeProgressStage.issue,
        ExchangeFlowStep.storeUsedNeedle ||
        ExchangeFlowStep.complete => ExchangeProgressStage.store,
        ExchangeFlowStep.done ||
        ExchangeFlowStep.cancelled ||
        ExchangeFlowStep.stuck => null,
      };
}

/// Doc 17 §44 progress labels.
enum ExchangeProgressStage {
  operator,
  oldNeedle,
  exchangeType,
  fragment,
  photo,
  newNeedle,
  issue,
  store,
}
