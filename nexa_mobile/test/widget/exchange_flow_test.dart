import 'dart:io';

import 'package:drift/drift.dart' show Value;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fake_exchange_server.dart';
import '../helpers/fixtures.dart';
import '../helpers/test_app.dart';

/// The exchange wizard end to end, online, against a fake backend that
/// follows the real state machine (Docs/21 phases 5–9; Doc 07 §59
/// scenarios). Create and operator are HTTP calls; every later step is a
/// `/mobile/sync` command sent at once while online (the offline path is in
/// `offline_sync_flow_test.dart`).

Future<(TestHarness, FakeExchangeServer)> _home(
  WidgetTester tester, {
  Map<String, int>? stock,
  Future<void> Function(TestHarness h)? seed,
  void Function(FakeExchangeServer server)? configure,
}) async {
  final h = TestHarness.provisioned();
  final server = FakeExchangeServer(h.backend, stock: stock)..install();
  configure?.call(server);
  await seedPreviousSession(h);
  if (seed != null) await seed(h);
  await h.pumpApp(tester);
  return (h, server);
}

Future<void> _tap(WidgetTester tester, String key) async {
  final finder = find.byKey(Key(key));
  for (var i = 0; i < 20 && finder.evaluate().isEmpty; i++) {
    await settle(tester, rounds: 2);
  }
  expect(finder, findsOneWidget, reason: 'missing $key');
  await tester.ensureVisible(finder);
  await tester.tap(finder);
  await settle(tester);
}

Finder _step(String name) => find.byKey(Key('exchange.step.$name'));

/// Waits (bounded) for a step to appear: requests go through real async
/// Dio/multipart streams, which may need more than one settle under load.
Future<void> _expectStep(WidgetTester tester, String name) =>
    _waitFor(tester, _step(name));

Future<void> _waitFor(WidgetTester tester, Finder finder) async {
  for (var i = 0; i < 20 && finder.evaluate().isEmpty; i++) {
    await settle(tester, rounds: 2);
  }
  expect(finder, findsWidgets);
}

Future<void> _openFlow(WidgetTester tester) => _tap(tester, 'home.newExchange');

Future<void> _identifyOperator(
  WidgetTester tester, {
  String uid = cardUid,
}) async {
  await _expectStep(tester, 'scanOperator');
  await tester.enterText(find.byKey(const Key('exchange.rfid.input')), uid);
  await _tap(tester, 'exchange.primary'); // CARI OPERATOR
}

Future<void> _toEvidence(WidgetTester tester, {String type = 'BENT'}) async {
  await _identifyOperator(tester);
  await _expectStep(tester, 'confirmOperator');
  expect(find.text('Siti Operator'), findsOneWidget);
  await _tap(tester, 'exchange.primary'); // KONFIRMASI OPERATOR
  await _expectStep(tester, 'oldNeedleType');
  await _tap(tester, 'needle.nt-1');
  await _tap(tester, 'exchange.primary'); // LANJUTKAN
  await _expectStep(tester, 'exchangeType');
  await _tap(tester, 'exchange.type.$type');
}

Future<void> _photo(WidgetTester tester) async {
  await _expectStep(tester, 'evidence');
  await _tap(tester, 'evidence.capture');
  await _tap(tester, 'evidence.use');
}

Future<List<LocalExchangeRow>> _localExchanges(
  WidgetTester tester,
  TestHarness h,
) async => (await tester.runAsync(
  () => h.database.select(h.database.localExchange).get(),
))!;

List<RecordedRequest> _posts(TestHarness h) => h.backend.requests
    .where((r) => r.method == 'POST' && r.path.startsWith('/exchanges'))
    .toList();

Future<List<LocalSyncQueueRow>> _queueRows(
  WidgetTester tester,
  TestHarness h,
) async => (await tester.runAsync(
  () => h.database.select(h.database.localSyncQueue).get(),
))!;

void main() {
  testWidgets('happy BENT flow: create → RFID → type → photo → new needle → '
      'issue → store → complete, all authoritative from the backend', (
    tester,
  ) async {
    final (h, server) = await _home(tester);
    final stockReadsBefore = h.backend
        .requestsTo('GET', '/inventory/trolleys/trolley-1')
        .length;

    await _openFlow(tester);

    // POST /exchanges from the cached device context (Doc 07 §4).
    final create = h.backend.requestsTo('POST', '/exchanges').single;
    final body = create.body! as Map<String, Object?>;
    expect(body['clientTransactionId'], isA<String>());
    expect(body['factoryId'], 'factory-1');
    expect(body['trolleyId'], 'trolley-1');
    expect(body['deviceId'], deviceId);
    expect(find.byKey(const Key('exchange.number')), findsOneWidget);
    // Resume pointer written before the create was sent.
    final pointer = (await _localExchanges(tester, h)).single;
    expect(pointer.clientTransactionId, body['clientTransactionId']);
    expect(pointer.createIdempotencyKey, create.header('Idempotency-Key'));
    expect(pointer.serverExchangeId, exchangeId);

    await _toEvidence(tester);
    // One SELECT_EXCHANGE_TYPE carries both screens' choices (matrix DRIFT
    // row), sent through /mobile/sync at once because the tablet is online.
    final type = server.syncCommands.single;
    expect(type['commandType'], 'SELECT_EXCHANGE_TYPE');
    expect(type['clientTransactionId'], body['clientTransactionId']);
    expect(type['payload'], {
      'exchangeTypeId': 'et-bent',
      'oldNeedleTypeId': 'nt-1',
    });

    await _photo(tester);
    await _expectStep(tester, 'newNeedle');
    expect(server.uploadedEvidence, ['OLD_NEEDLE']);
    expect(server.state, 'EVIDENCE_CAPTURED');
    // The local copy is gone only after the backend confirmed the upload.
    expect(h.evidenceDir.listSync(recursive: true).whereType<File>(), isEmpty);

    // New needle defaults to the old one; stock hint from inventory.
    expect(find.textContaining('DBX1-14 · DBx1 #14'), findsWidgets);
    expect(find.text('${AppStrings.stockOnTrolley}: 25 pcs'), findsOneWidget);
    await _tap(tester, 'exchange.primary');

    await _expectStep(tester, 'issue');
    expect(server.stock['nt-1'], 25, reason: 'nothing issued before confirm');
    await _tap(tester, 'exchange.primary');
    await _expectStep(tester, 'storeUsedNeedle');
    expect(server.stock['nt-1'], 24);
    expect(find.text(AppStrings.issueDone), findsOneWidget);

    expect(find.text('LUBANG JARUM BENGKOK'), findsOneWidget);
    await _tap(tester, 'exchange.primary');

    await _expectStep(tester, 'complete');
    await _tap(tester, 'exchange.primary');

    await _expectStep(tester, 'done');
    expect(find.text(AppStrings.doneTitle), findsOneWidget);
    expect(server.state, 'COMPLETED');
    // Kept for the 7-day retention, closed, its sync confirmed.
    final finished = (await _localExchanges(tester, h)).single;
    expect(finished.lastKnownStatus, 'COMPLETED');
    expect(finished.closedAt, isNotNull);
    expect(finished.syncConfirmedAt, isNotNull);
    expect(
      (await _queueRows(tester, h)).map((r) => r.status),
      everyElement('ACCEPTED'),
    );

    // HTTP only for create, operator and the photo — each with its own
    // Idempotency-Key.
    final posts = _posts(h);
    expect(posts.map((r) => r.path), [
      '/exchanges',
      '/exchanges/$exchangeId/operator',
      '/exchanges/$exchangeId/evidence',
    ]);
    final keys = posts.map((r) => r.header('Idempotency-Key')).toList();
    expect(keys, everyElement(isNotNull));
    expect(keys.toSet(), hasLength(keys.length));
    // Every later step went through /mobile/sync, in order, each with its
    // own commandId — and the sync request itself carries no
    // Idempotency-Key (Docs/12 §19).
    expect(server.syncCommands.map((c) => c['commandType']), [
      'SELECT_EXCHANGE_TYPE',
      'SELECT_NEW_NEEDLE',
      'ISSUE_NEEDLE',
      'STORE_USED_NEEDLE',
      'COMPLETE_EXCHANGE',
    ]);
    final ids = server.syncCommands.map((c) => c['commandId']).toSet();
    expect(ids, hasLength(5));
    for (final sync in h.backend.requestsTo('POST', '/mobile/sync')) {
      expect(sync.header('Idempotency-Key'), isNull);
      expect(sync.header('X-Device-ID'), deviceId);
    }

    // Back on Home, stock and today's count are read again.
    await _tap(tester, 'exchange.primary'); // SELESAI
    await _waitFor(
      tester,
      find.text('${AppStrings.homeHistorySubtitlePrefix}1'),
    );
    expect(find.byKey(const Key('home.newExchange')), findsOneWidget);
    expect(
      h.backend.requestsTo('GET', '/inventory/trolleys/trolley-1').length,
      greaterThan(stockReadsBefore),
    );
    expect(
      find.text('${AppStrings.homeHistorySubtitlePrefix}1'),
      findsOneWidget,
    );
  });

  testWidgets('BROKEN + fragment NOT_FOUND waits for approval, then continues '
      'with the photo once APPROVED', (tester) async {
    final (h, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester, type: 'BROKEN');

    await _expectStep(tester, 'fragmentCheck');
    await _tap(tester, 'exchange.fragment.notFound');

    await _expectStep(tester, 'awaitingConfirmation');
    expect(server.state, 'CONFIRMATION_PENDING');
    expect(find.text(AppStrings.awaitingTitle), findsOneWidget);

    // Still pending: CEK STATUS keeps waiting.
    await _tap(tester, 'exchange.primary');
    await _expectStep(tester, 'awaitingConfirmation');

    server.confirmationStatus = 'APPROVED';
    await _tap(tester, 'exchange.primary');
    await _expectStep(tester, 'evidence');
    expect(find.text(AppStrings.confirmationApproved), findsOneWidget);
    expect(
      h.backend.requestsTo('GET', '/confirmations/$confirmationId'),
      hasLength(greaterThanOrEqualTo(2)),
    );

    // NOT_FOUND needs only the old-needle photo (evidence policy).
    await _photo(tester);
    await _expectStep(tester, 'newNeedle');
    expect(server.uploadedEvidence, ['OLD_NEEDLE']);
  });

  testWidgets('a REJECTED confirmation blocks the exchange; only cancelling '
      'releases it', (tester) async {
    final (_, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester, type: 'BROKEN');
    await _tap(tester, 'exchange.fragment.notFound');

    server
      ..confirmationStatus = 'REJECTED'
      ..rejectionReason = 'Patahan harus dicari dulu';
    await _tap(tester, 'exchange.primary'); // CEK STATUS
    await _expectStep(tester, 'confirmationBlocked');
    expect(find.text('Patahan harus dicari dulu'), findsOneWidget);

    await _tap(tester, 'exchange.primary'); // BATALKAN TRANSAKSI
    // The reason is prefilled but still confirmed by the PIC.
    await _tap(tester, 'cancel.confirm');
    await _expectStep(tester, 'cancelled');
    expect(server.state, 'CANCELLED');
    expect(server.cancelReason, AppStrings.confirmationRejectedReason);
  });

  testWidgets('BROKEN + FOUND asks for two photos (old needle, fragment)', (
    tester,
  ) async {
    final (_, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester, type: 'BROKEN');
    await _tap(tester, 'exchange.fragment.found');

    await _waitFor(tester, find.textContaining('(1 ${AppStrings.photoOf} 2)'));
    await _photo(tester);
    await _waitFor(tester, find.textContaining('(2 ${AppStrings.photoOf} 2)'));
    expect(server.uploadedEvidence, ['OLD_NEEDLE']);
    await _photo(tester);
    await _expectStep(tester, 'newNeedle');
    expect(server.uploadedEvidence, ['OLD_NEEDLE', 'BROKEN_FRAGMENT']);
  });

  testWidgets('insufficient stock: Doc 07 §24 message with the available '
      'quantity, then another needle type goes through', (tester) async {
    final (_, server) = await _home(tester, stock: {'nt-1': 0, 'nt-2': 5});
    await _openFlow(tester);
    await _toEvidence(tester);
    await _photo(tester);

    await _tap(tester, 'exchange.primary'); // PILIH JARUM BARU (nt-1)
    await _waitFor(tester, find.byKey(const Key('exchange.stockProblem')));
    expect(find.textContaining(AppStrings.stockUnavailable), findsOneWidget);
    expect(
      find.textContaining('${AppStrings.stockAvailableLabel}: 0'),
      findsOneWidget,
    );
    expect(server.state, 'EVIDENCE_CAPTURED', reason: 'nothing moved');
    await _expectStep(tester, 'newNeedle');

    await _tap(tester, 'exchange.changeNewNeedle');
    await _tap(tester, 'needle.nt-2');
    expect(find.byKey(const Key('exchange.stockProblem')), findsNothing);
    await _tap(tester, 'exchange.primary');
    await _expectStep(tester, 'issue');
    expect(server.exchange!['newNeedleTypeId'], 'nt-2');
  });

  testWidgets('cancel after issue: mandatory reason, backend reverses the '
      'stock, the result is shown', (tester) async {
    final (h, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester);
    await _photo(tester);
    await _tap(tester, 'exchange.primary'); // new needle
    await _tap(tester, 'exchange.primary'); // issue
    await _expectStep(tester, 'storeUsedNeedle');
    expect(server.stock['nt-1'], 24);

    await _tap(tester, 'exchange.cancel');
    await _waitFor(tester, find.text(AppStrings.cancelExchangeAfterIssue));
    // No reason, no cancel.
    final confirm = tester.widget<FilledButton>(
      find.byKey(const Key('cancel.confirm')),
    );
    expect(confirm.onPressed, isNull);
    await _tap(tester, 'cancel.preset.0');
    await _tap(tester, 'cancel.confirm');

    await _expectStep(tester, 'cancelled');
    expect(server.state, 'CANCELLED');
    expect(server.cancelReason, AppStrings.cancelReasonPresets.first);
    expect(server.stock['nt-1'], 25, reason: 'REVERSAL by the backend');
    expect(find.textContaining(AppStrings.cancelledReversed), findsOneWidget);
    final row = (await _localExchanges(tester, h)).single;
    expect(row.lastKnownStatus, 'CANCELLED');
    expect(row.closedAt, isNotNull);
    final cancel = server.syncCommands.last;
    expect(cancel['commandType'], 'CANCEL_EXCHANGE');
    expect(cancel['payload'], {'reason': AppStrings.cancelReasonPresets.first});
    expect(cancel['commandId'], isA<String>());
  });

  testWidgets('resume after restart: Home reopens the unfinished exchange at '
      'the server state and uploads the kept photo with its own key', (
    tester,
  ) async {
    late File keptPhoto;
    final (h, _) = await _home(
      tester,
      // The server moved on while the app was dead: type already selected.
      configure: (server) => server.seedBent('EXCHANGE_TYPE_SELECTED'),
      seed: (h) async {
        final now = DateTime(2026, 9, 25, 8);
        keptPhoto = File('${h.evidenceDir.path}/kept.jpg')
          ..writeAsBytesSync([0xFF, 0xD8, 1, 2, 0xFF, 0xD9]);
        await h.database
            .into(h.database.localExchange)
            .insert(
              LocalExchangeCompanion.insert(
                clientTransactionId: 'ctid-resume',
                createIdempotencyKey: 'create-key',
                deviceId: deviceId,
                serverExchangeId: const Value(exchangeId),
                exchangeNumber: const Value('EXC-20260925-000001'),
                operatorEmployeeNumber: const Value('EMP001'),
                operatorName: const Value('Siti Operator'),
                createdAt: now,
                updatedAt: now,
              ),
            );
        await h.database
            .into(h.database.localExchangeEvidence)
            .insert(
              LocalExchangeEvidenceCompanion.insert(
                id: 'ev-local-1',
                clientTransactionId: 'ctid-resume',
                evidenceType: 'OLD_NEEDLE',
                filePath: keptPhoto.path,
                mimeType: 'image/jpeg',
                byteSize: 6,
                capturedAt: now,
                idempotencyKey: 'photo-key-1',
                uploadStatus: 'UPLOAD_FAILED',
              ),
            );
      },
    );

    // Auto-resumed without tapping anything, no second exchange created.
    await _expectStep(tester, 'evidence');
    expect(h.backend.requestsTo('POST', '/exchanges'), isEmpty);
    expect(find.byKey(const Key('evidence.use')), findsOneWidget);
    expect(find.text(AppStrings.photoUploadFailed), findsOneWidget);

    await _tap(tester, 'evidence.use');
    final upload = h.backend
        .requestsTo('POST', '/exchanges/$exchangeId/evidence')
        .single;
    expect(upload.header('Idempotency-Key'), 'photo-key-1');
    // The step moves only after the confirmed upload was processed.
    await _expectStep(tester, 'newNeedle');
    expect(keptPhoto.existsSync(), isFalse);
  });

  testWidgets('offline blocks the RFID step (MG-6) and says so; back online '
      'the scan continues', (tester) async {
    final (h, _) = await _home(tester);
    await _openFlow(tester);
    await _expectStep(tester, 'scanOperator');

    h.connectivity.set(ConnectivityStatus.offline);
    await settle(tester);
    await _expectStep(tester, 'scanOperatorOffline');
    expect(find.text(AppStrings.rfidOfflineTitle), findsOneWidget);
    expect(find.byKey(const Key('exchange.rfid.input')), findsNothing);
    expect(
      h.backend.requests.where((r) => r.path.startsWith('/rfid')),
      isEmpty,
    );

    h.connectivity.set(ConnectivityStatus.online);
    await settle(tester);
    await _identifyOperator(tester);
    await _expectStep(tester, 'confirmOperator');
  });

  testWidgets('starting offline: the flow cannot start and says so', (
    tester,
  ) async {
    final (h, _) = await _home(tester);
    h.connectivity.set(ConnectivityStatus.offline);
    await settle(tester);
    await _openFlow(tester);

    await _expectStep(tester, 'startFailed');
    expect(find.text(AppStrings.exchangeNeedsConnection), findsOneWidget);
    expect(h.backend.requestsTo('POST', '/exchanges'), isEmpty);
  });

  testWidgets('unknown RFID card: safe message, stays on the scan step', (
    tester,
  ) async {
    await _home(tester);
    await _openFlow(tester);
    await _identifyOperator(tester, uid: 'UNKNOWN');

    await _expectStep(tester, 'scanOperator');
    expect(find.text(AppStrings.rfidRejectedTitle), findsOneWidget);
    expect(find.textContaining('RFID_NOT_FOUND'), findsNothing);
  });

  testWidgets('a technical failure keeps the step queued under the same '
      'commandId: retried immediately, then by hand; the PIC carries on and '
      'the step executes exactly once (Doc 15 §14)', (tester) async {
    final (h, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester);
    await _photo(tester);
    await _tap(tester, 'exchange.primary'); // new needle
    await _expectStep(tester, 'issue');

    // The next two sync requests get no usable answer.
    var failures = 2;
    server.interceptSync = (_) =>
        failures-- > 0 ? const FakeResponse(503) : null;

    await _tap(tester, 'exchange.primary'); // issue → 503, immediate retry 503
    // Not lost and not shown as done: the wizard moves on, marked unconfirmed.
    await _expectStep(tester, 'storeUsedNeedle');
    expect(find.text(AppStrings.pendingSyncTitle), findsWidgets);
    expect(find.text(AppStrings.issueDone), findsNothing);
    expect(server.stock['nt-1'], 25, reason: 'nothing issued yet');
    await _waitFor(tester, find.byKey(const Key('exchange.retry')));

    await _tap(tester, 'exchange.retry'); // "retry now", backoff ignored
    await _waitFor(
      tester,
      find.byKey(const Key('exchange.step.storeUsedNeedle')),
    );
    for (var i = 0; i < 10 && server.stock['nt-1'] == 25; i++) {
      await settle(tester, rounds: 2);
    }
    expect(server.stock['nt-1'], 24);
    final issues = server.syncCommands
        .where((c) => c['commandType'] == 'ISSUE_NEEDLE')
        .toList();
    expect(issues.map((c) => c['commandId']).toSet(), hasLength(1));
    expect(server.executed['ISSUE_NEEDLE'], 1);
    await _waitFor(
      tester,
      find.byKey(const Key('exchange.step.storeUsedNeedle')),
    );
    expect(find.byKey(const Key('exchange.pendingSync')), findsNothing);
  });

  testWidgets('EXCHANGE_INVALID_STATE re-reads the exchange and shows the '
      'step of the authoritative state', (tester) async {
    final (h, server) = await _home(tester);
    await _openFlow(tester);
    await _toEvidence(tester);
    await _photo(tester);
    await _expectStep(tester, 'newNeedle');

    // Another client already selected the new needle on the server.
    server.exchange = {
      ...server.exchange!,
      'status': 'NEW_NEEDLE_SELECTED',
      'newNeedleTypeId': 'nt-1',
    };
    await _tap(tester, 'exchange.primary');

    await _expectStep(tester, 'issue');
    expect(find.text(AppStrings.exchangeResynced), findsOneWidget);
    expect(h.backend.requestsTo('GET', '/exchanges/$exchangeId'), isNotEmpty);
  });
}
