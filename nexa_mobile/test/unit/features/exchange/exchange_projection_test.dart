import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_projection.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';

final _t0 = DateTime(2026, 9, 28, 8);
var _seq = 0;

SyncCommand q(SyncCommandType type, [Map<String, Object?> payload = const {}]) {
  _seq++;
  return SyncCommand(
    sequence: _seq,
    commandId: 'c$_seq',
    clientTransactionId: 'A',
    type: type,
    payload: payload,
    occurredAt: _t0,
    status: SyncCommandStatus.queued,
    createdAt: _t0,
  );
}

const _server = ExchangeSnapshot(
  id: 'e1',
  exchangeNumber: 'EXC-1',
  state: ExchangeState.operatorIdentified,
  factoryId: 'f',
  trolleyId: 't',
  deviceId: 'd',
  operatorId: 'emp-1',
);

({String code, String name})? _types(String id) => switch (id) {
  'et-bent' => (code: 'BENT', name: 'Bent Needle'),
  'et-broken' => (code: 'BROKEN', name: 'Broken Needle'),
  _ => null,
};

ExchangeFlowStep stepOf(ExchangeProjection p, {ConfirmationStatus? c}) =>
    ExchangeStepMapper.stepFor(
      p.exchange,
      confirmationStatus: c,
      closurePending: p.closure != null,
    );

void main() {
  test('nothing queued: the server snapshot, not pending', () {
    final p = ExchangeProjection.of(_server, const []);
    expect(p.exchange, same(_server));
    expect(p.isPending, isFalse);
  });

  test('BENT offline: type → photos → new needle → issue → store → complete '
      'is shown as waiting to sync, never COMPLETED', () {
    final type = q(SyncCommandType.selectExchangeType, {
      'exchangeTypeId': 'et-bent',
      'oldNeedleTypeId': 'nt-1',
    });
    var p = ExchangeProjection.of(_server, [type], exchangeType: _types);
    expect(p.exchange.state, ExchangeState.exchangeTypeSelected);
    expect(p.exchange.exchangeTypeCode, 'BENT');
    expect(p.exchange.oldNeedleTypeId, 'nt-1');
    expect(stepOf(p), ExchangeFlowStep.evidence);

    p = ExchangeProjection.of(
      _server,
      [type],
      exchangeType: _types,
      evidenceComplete: true,
    );
    expect(p.exchange.state, ExchangeState.evidenceCaptured);
    expect(p.evidencePending, isTrue);
    expect(stepOf(p), ExchangeFlowStep.newNeedle);

    final rest = [
      type,
      q(SyncCommandType.selectNewNeedle, {'needleTypeId': 'nt-2'}),
      q(SyncCommandType.issueNeedle),
    ];
    p = ExchangeProjection.of(_server, rest, exchangeType: _types);
    expect(p.exchange.newNeedleTypeId, 'nt-2');
    expect(p.exchange.state, ExchangeState.needleIssued);
    expect(p.issuePending, isTrue, reason: 'stock not confirmed');
    expect(stepOf(p), ExchangeFlowStep.storeUsedNeedle);

    p = ExchangeProjection.of(_server, [
      ...rest,
      q(SyncCommandType.storeUsedNeedle),
      q(SyncCommandType.completeExchange),
    ], exchangeType: _types);
    expect(p.exchange.state, ExchangeState.usedNeedleStored);
    expect(p.closure, PendingClosure.complete);
    expect(stepOf(p), ExchangeFlowStep.awaitingSync);
    expect(p.exchange.state, isNot(ExchangeState.completed));
    // The server snapshot itself is untouched.
    expect(_server.state, ExchangeState.operatorIdentified);
  });

  test(
    'BROKEN + NOT_FOUND offline waits for approval (pending confirmation)',
    () {
      final p = ExchangeProjection.of(_server, [
        q(SyncCommandType.selectExchangeType, {
          'exchangeTypeId': 'et-broken',
          'oldNeedleTypeId': 'nt-1',
        }),
        q(SyncCommandType.fragmentValidation, {'fragmentStatus': 'NOT_FOUND'}),
      ], exchangeType: _types);
      expect(p.exchange.state, ExchangeState.confirmationPending);
      expect(p.exchange.fragmentStatus, FragmentStatus.notFound);
      expect(p.fragmentPending, isTrue);
      expect(stepOf(p), ExchangeFlowStep.awaitingConfirmation);
      // Photos never skip an approval that has not happened.
      final withPhotos = ExchangeProjection.of(
        _server,
        [
          q(SyncCommandType.selectExchangeType, {
            'exchangeTypeId': 'et-broken',
            'oldNeedleTypeId': 'nt-1',
          }),
          q(SyncCommandType.fragmentValidation, {
            'fragmentStatus': 'NOT_FOUND',
          }),
        ],
        exchangeType: _types,
        evidenceComplete: false,
      );
      expect(stepOf(withPhotos), ExchangeFlowStep.awaitingConfirmation);
    },
  );

  test('BROKEN + FOUND: fragment check, then evidence', () {
    final p = ExchangeProjection.of(_server, [
      q(SyncCommandType.selectExchangeType, {
        'exchangeTypeId': 'et-broken',
        'oldNeedleTypeId': 'nt-1',
      }),
      q(SyncCommandType.fragmentValidation, {'fragmentStatus': 'FOUND'}),
    ], exchangeType: _types);
    expect(p.exchange.state, ExchangeState.fragmentCheck);
    expect(stepOf(p), ExchangeFlowStep.evidence);
  });

  test('a queued cancel is a pending closure; a non-queued command is '
      'ignored', () {
    final accepted = SyncCommand(
      sequence: 99,
      commandId: 'x',
      clientTransactionId: 'A',
      type: SyncCommandType.selectExchangeType,
      payload: const {'exchangeTypeId': 'et-bent'},
      occurredAt: _t0,
      status: SyncCommandStatus.accepted,
      createdAt: _t0,
    );
    final p = ExchangeProjection.of(_server, [
      accepted,
      q(SyncCommandType.cancelExchange, {'reason': 'x'}),
    ]);
    expect(p.closure, PendingClosure.cancel);
    expect(p.exchange.state, ExchangeState.operatorIdentified);
    expect(stepOf(p), ExchangeFlowStep.awaitingSync);
  });
}
