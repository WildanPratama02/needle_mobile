import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';

ExchangeSnapshot _exchange(
  ExchangeState state, {
  String? typeCode,
  FragmentStatus? fragment,
}) => ExchangeSnapshot(
  id: 'exc-1',
  exchangeNumber: 'EXC-1',
  state: state,
  factoryId: 'f',
  trolleyId: 't',
  deviceId: 'd',
  exchangeTypeCode: typeCode,
  fragmentStatus: fragment,
);

void main() {
  group('ExchangeStepMapper.stepFor — the one state → step table', () {
    final table = <(ExchangeState, String?), ExchangeFlowStep>{
      (ExchangeState.created, null): ExchangeFlowStep.scanOperator,
      (ExchangeState.operatorIdentified, null): ExchangeFlowStep.oldNeedleType,
      (ExchangeState.needleSelected, null): ExchangeFlowStep.stuck,
      (ExchangeState.exchangeTypeSelected, 'BENT'): ExchangeFlowStep.evidence,
      (ExchangeState.exchangeTypeSelected, 'CHANGEOVER'):
          ExchangeFlowStep.evidence,
      (ExchangeState.exchangeTypeSelected, 'BROKEN'):
          ExchangeFlowStep.fragmentCheck,
      (ExchangeState.fragmentCheck, 'BROKEN'): ExchangeFlowStep.evidence,
      (ExchangeState.evidenceCaptured, 'BENT'): ExchangeFlowStep.newNeedle,
      (ExchangeState.newNeedleSelected, 'BENT'): ExchangeFlowStep.issue,
      (ExchangeState.needleIssued, 'BENT'): ExchangeFlowStep.storeUsedNeedle,
      (ExchangeState.usedNeedleStored, 'BENT'): ExchangeFlowStep.complete,
      (ExchangeState.completed, 'BENT'): ExchangeFlowStep.done,
      (ExchangeState.cancelled, 'BENT'): ExchangeFlowStep.cancelled,
    };
    for (final MapEntry(key: (state, code), value: step) in table.entries) {
      test('${state.wire}${code == null ? '' : ' ($code)'} → ${step.name}', () {
        expect(
          ExchangeStepMapper.stepFor(_exchange(state, typeCode: code)),
          step,
        );
      });
    }

    test('every server state has a step (no gaps)', () {
      for (final state in ExchangeState.values) {
        expect(
          () => ExchangeStepMapper.stepFor(_exchange(state, typeCode: 'BENT')),
          returnsNormally,
        );
      }
    });

    test('CONFIRMATION_PENDING follows the confirmation status', () {
      final pending = _exchange(
        ExchangeState.confirmationPending,
        typeCode: 'BROKEN',
        fragment: FragmentStatus.notFound,
      );
      expect(
        ExchangeStepMapper.stepFor(pending),
        ExchangeFlowStep.awaitingConfirmation,
        reason: 'not read yet = still waiting',
      );
      expect(
        ExchangeStepMapper.stepFor(
          pending,
          confirmationStatus: ConfirmationStatus.pending,
        ),
        ExchangeFlowStep.awaitingConfirmation,
      );
      expect(
        ExchangeStepMapper.stepFor(
          pending,
          confirmationStatus: ConfirmationStatus.approved,
        ),
        ExchangeFlowStep.evidence,
      );
      for (final blocked in [
        ConfirmationStatus.rejected,
        ConfirmationStatus.expired,
      ]) {
        expect(
          ExchangeStepMapper.stepFor(pending, confirmationStatus: blocked),
          ExchangeFlowStep.confirmationBlocked,
        );
      }
    });

    test('local choices refine only their own server state', () {
      expect(
        ExchangeStepMapper.stepFor(
          _exchange(ExchangeState.created),
          hasOperatorCandidate: true,
        ),
        ExchangeFlowStep.confirmOperator,
      );
      expect(
        ExchangeStepMapper.stepFor(
          _exchange(ExchangeState.operatorIdentified),
          hasOldNeedleChoice: true,
        ),
        ExchangeFlowStep.exchangeType,
      );
      // A stale local choice never overrides a server that moved on.
      expect(
        ExchangeStepMapper.stepFor(
          _exchange(ExchangeState.evidenceCaptured, typeCode: 'BENT'),
          hasOperatorCandidate: true,
          hasOldNeedleChoice: true,
        ),
        ExchangeFlowStep.newNeedle,
      );
    });
  });

  group('progress (Doc 17 §44)', () {
    test('the fragment stage exists for BROKEN only', () {
      expect(
        ExchangeStepMapper.stagesFor(broken: true),
        contains(ExchangeProgressStage.fragment),
      );
      expect(
        ExchangeStepMapper.stagesFor(broken: false),
        isNot(contains(ExchangeProgressStage.fragment)),
      );
      expect(ExchangeStepMapper.stagesFor(broken: false), hasLength(7));
    });

    test('every in-flow step maps to a stage, terminal ones do not', () {
      for (final step in ExchangeFlowStep.values) {
        final stage = ExchangeStepMapper.stageOf(step);
        final expectsStage =
            !step.isTerminal &&
            step != ExchangeFlowStep.starting &&
            step != ExchangeFlowStep.stuck;
        expect(stage != null, expectsStage, reason: step.name);
      }
    });
  });

  group('ExchangeState', () {
    test('wire names are the CONTEXT.md canonical values', () {
      expect(ExchangeState.values.map((s) => s.wire), [
        'CREATED',
        'OPERATOR_IDENTIFIED',
        'NEEDLE_SELECTED',
        'EXCHANGE_TYPE_SELECTED',
        'FRAGMENT_CHECK',
        'CONFIRMATION_PENDING',
        'EVIDENCE_CAPTURED',
        'NEW_NEEDLE_SELECTED',
        'NEEDLE_ISSUED',
        'USED_NEEDLE_STORED',
        'COMPLETED',
        'CANCELLED',
      ]);
      expect(ExchangeState.fromWire('DRAFT'), isNull);
    });

    test('stock was issued only in NEEDLE_ISSUED / USED_NEEDLE_STORED', () {
      expect(ExchangeState.values.where((s) => s.stockIssued), [
        ExchangeState.needleIssued,
        ExchangeState.usedNeedleStored,
      ]);
    });

    test('NOT_REQUIRED confirmation is null on the wire (MG-10)', () {
      expect(ConfirmationStatus.fromWire(null), isNull);
      expect(ConfirmationStatus.fromWire('NOT_REQUIRED'), isNull);
    });
  });
}
