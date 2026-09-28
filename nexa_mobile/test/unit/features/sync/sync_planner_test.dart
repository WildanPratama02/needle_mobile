import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/sync/domain/sync_backoff.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_planner.dart';

final _t0 = DateTime(2026, 9, 28, 8);

SyncCommand cmd(
  int sequence,
  String ctx,
  SyncCommandType type, {
  SyncCommandStatus status = SyncCommandStatus.queued,
  DateTime? nextAttemptAt,
  int attempts = 0,
}) => SyncCommand(
  sequence: sequence,
  commandId: 'c$sequence',
  clientTransactionId: ctx,
  type: type,
  payload: const {},
  occurredAt: _t0,
  status: status,
  createdAt: _t0,
  attemptCount: attempts,
  nextAttemptAt: nextAttemptAt,
);

List<String> ids(SyncPlan plan) => plan.batch.map((c) => c.commandId).toList();

void main() {
  group('planSyncBatch — order (Doc 15 §12)', () {
    test('creation order across exchanges; per exchange strictly ordered', () {
      final plan = planSyncBatch(
        now: _t0,
        commands: [
          cmd(3, 'B', SyncCommandType.selectExchangeType),
          cmd(1, 'A', SyncCommandType.selectExchangeType),
          cmd(4, 'A', SyncCommandType.selectNewNeedle),
          cmd(2, 'A', SyncCommandType.fragmentValidation),
          cmd(5, 'B', SyncCommandType.selectNewNeedle),
        ],
      );
      expect(ids(plan), ['c1', 'c2', 'c3', 'c4', 'c5']);
    });

    test('accepted commands are never sent again', () {
      final plan = planSyncBatch(
        now: _t0,
        commands: [
          cmd(
            1,
            'A',
            SyncCommandType.selectExchangeType,
            status: SyncCommandStatus.accepted,
          ),
          cmd(2, 'A', SyncCommandType.fragmentValidation),
        ],
      );
      expect(ids(plan), ['c2']);
    });

    test('at most 50 per request, and each exchange stays a prefix', () {
      final commands = [
        for (var i = 1; i <= 60; i++)
          cmd(i, i.isEven ? 'A' : 'B', SyncCommandType.issueNeedle),
      ];
      final plan = planSyncBatch(now: _t0, commands: commands);
      expect(plan.batch, hasLength(maxSyncBatch));
      expect(ids(plan), [for (var i = 1; i <= 50; i++) 'c$i']);
    });
  });

  group('planSyncBatch — halting per exchange', () {
    test('a REJECTED command halts the rest of its exchange only', () {
      final plan = planSyncBatch(
        now: _t0,
        commands: [
          cmd(
            1,
            'A',
            SyncCommandType.issueNeedle,
            status: SyncCommandStatus.rejected,
          ),
          cmd(2, 'A', SyncCommandType.storeUsedNeedle),
          cmd(3, 'B', SyncCommandType.selectExchangeType),
          cmd(4, 'A', SyncCommandType.completeExchange),
        ],
      );
      expect(ids(plan), ['c3'], reason: 'B still goes; A waits for the PIC');
      expect(plan.superseded, isEmpty);
    });

    test('a later CANCEL of the same exchange supersedes the rejection: the '
        'never-executed steps are dropped, the cancel goes out', () {
      final plan = planSyncBatch(
        now: _t0,
        commands: [
          cmd(
            1,
            'A',
            SyncCommandType.issueNeedle,
            status: SyncCommandStatus.rejected,
          ),
          cmd(2, 'A', SyncCommandType.storeUsedNeedle),
          cmd(3, 'A', SyncCommandType.completeExchange),
          cmd(4, 'A', SyncCommandType.cancelExchange),
        ],
      );
      expect(ids(plan), ['c4']);
      expect(plan.superseded.map((c) => c.commandId), ['c1', 'c2', 'c3']);
    });

    test('a cancel queued before the rejected step does not supersede it', () {
      final halted = resolveHaltedByCancel([
        cmd(
          1,
          'A',
          SyncCommandType.cancelExchange,
          status: SyncCommandStatus.accepted,
        ),
        cmd(
          2,
          'A',
          SyncCommandType.issueNeedle,
          status: SyncCommandStatus.rejected,
        ),
      ]);
      expect(halted.cancel, isNull);
      expect(halted.drop, isEmpty);
    });
  });

  group('planSyncBatch — technical-failure delay', () {
    test('an exchange whose next command waits out its delay sends nothing; '
        'others go; "retry now" ignores the delay', () {
      final commands = [
        cmd(
          1,
          'A',
          SyncCommandType.issueNeedle,
          attempts: 2,
          nextAttemptAt: _t0.add(const Duration(seconds: 5)),
        ),
        cmd(2, 'A', SyncCommandType.storeUsedNeedle),
        cmd(3, 'B', SyncCommandType.selectExchangeType),
      ];
      expect(ids(planSyncBatch(now: _t0, commands: commands)), ['c3']);
      expect(
        ids(
          planSyncBatch(
            now: _t0.add(const Duration(seconds: 5)),
            commands: commands,
          ),
        ),
        ['c1', 'c2', 'c3'],
      );
      expect(
        ids(planSyncBatch(now: _t0, commands: commands, ignoreBackoff: true)),
        ['c1', 'c2', 'c3'],
      );
    });
  });

  group('planSyncBatch — photos before the steps that need them (MG-7)', () {
    test('while photos wait, the exchange stops before SELECT_NEW_NEEDLE', () {
      final commands = [
        cmd(1, 'A', SyncCommandType.selectExchangeType),
        cmd(2, 'A', SyncCommandType.selectNewNeedle),
        cmd(3, 'A', SyncCommandType.issueNeedle),
        cmd(4, 'B', SyncCommandType.issueNeedle),
      ];
      expect(
        ids(
          planSyncBatch(now: _t0, commands: commands, awaitingEvidence: {'A'}),
        ),
        ['c1', 'c4'],
      );
      expect(ids(planSyncBatch(now: _t0, commands: commands)), [
        'c1',
        'c2',
        'c3',
        'c4',
      ]);
    });
  });

  group('SyncBackoff (Doc 15 §14, locked 2026-09-28)', () {
    test('immediately, 5 s, 15 s, 30 s, 1 min, then every 5 min — no cap', () {
      expect(
        [for (var n = 1; n <= 8; n++) SyncBackoff.delayAfter(n)],
        [
          Duration.zero,
          const Duration(seconds: 5),
          const Duration(seconds: 15),
          const Duration(seconds: 30),
          const Duration(minutes: 1),
          const Duration(minutes: 5),
          const Duration(minutes: 5),
          const Duration(minutes: 5),
        ],
      );
      expect(SyncBackoff.delayAfter(500), const Duration(minutes: 5));
      expect(SyncBackoff.delayAfter(0), Duration.zero);
    });
  });

  group('SyncCommandType', () {
    test(
      'wire names are the backend SYNC_COMMAND_TYPES, in Doc 15 §12 order',
      () {
        expect(SyncCommandType.values.map((t) => t.wire), [
          'CREATE_EXCHANGE',
          'ASSIGN_OPERATOR',
          'SELECT_EXCHANGE_TYPE',
          'FRAGMENT_VALIDATION',
          'SELECT_NEW_NEEDLE',
          'ISSUE_NEEDLE',
          'STORE_USED_NEEDLE',
          'COMPLETE_EXCHANGE',
          'CANCEL_EXCHANGE',
        ]);
      },
    );

    test('create and operator are modelled but never queued by the wizard', () {
      expect(SyncCommandType.createExchange.queueable, isFalse);
      expect(SyncCommandType.assignOperator.queueable, isFalse);
      expect(
        SyncCommandType.values.where((t) => t.queueable),
        hasLength(SyncCommandType.values.length - 2),
      );
    });
  });
}
