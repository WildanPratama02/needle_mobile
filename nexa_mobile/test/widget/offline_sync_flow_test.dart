import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart' show Value;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_screen.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

import '../helpers/fake_backend.dart';
import '../helpers/fake_exchange_server.dart';
import '../helpers/fixtures.dart';
import '../helpers/flow_driver.dart';
import '../helpers/test_app.dart';

/// Phase 9: finishing an exchange offline after the operator was identified
/// online, and what the PIC sees as the queue reaches the server
/// (nexa_mobile/CLAUDE.md §2 "Offline scope"; Doc 15 §8–14; Doc 17 §28–30,
/// §47).

Future<(TestHarness, FakeExchangeServer)> _home(
  WidgetTester tester, {
  Map<String, int>? stock,
}) async {
  final h = TestHarness.provisioned();
  final server = FakeExchangeServer(h.backend, stock: stock)..install();
  await seedPreviousSession(h);
  await h.pumpApp(tester);
  return (h, server);
}

Future<void> _offline(WidgetTester tester, TestHarness h) async {
  h.connectivity.set(ConnectivityStatus.offline);
  await settle(tester);
}

Future<void> _online(WidgetTester tester, TestHarness h) async {
  h.connectivity.set(ConnectivityStatus.online);
  await settle(tester);
}

Future<List<LocalSyncQueueRow>> _queue(
  WidgetTester tester,
  TestHarness h,
) async => (await tester.runAsync(
  () => h.database.select(h.database.localSyncQueue).get(),
))!;

Future<List<LocalExchangeEvidenceRow>> _photos(
  WidgetTester tester,
  TestHarness h,
) async => (await tester.runAsync(
  () => h.database.select(h.database.localExchangeEvidence).get(),
))!;

Future<String> _ctx(WidgetTester tester, TestHarness h) async =>
    (await tester.runAsync(
      () => h.database.select(h.database.localExchange).getSingle(),
    ))!.clientTransactionId;

List<RecordedRequest> _syncs(TestHarness h) =>
    h.backend.requestsTo('POST', '/mobile/sync');

/// Operator online, then everything after it offline, up to "waiting to
/// sync".
Future<void> _finishBentOffline(WidgetTester tester, TestHarness h) async {
  await identifyOperatorOnline(tester);
  await _offline(tester, h);
  await chooseTypes(tester);
  await takePhoto(tester);
  await expectStep(tester, 'newNeedle');
  await tapKey(tester, 'exchange.primary'); // PILIH JARUM BARU
  await expectStep(tester, 'issue');
  await tapKey(tester, 'exchange.primary'); // KELUARKAN JARUM
  await expectStep(tester, 'storeUsedNeedle');
  await tapKey(tester, 'exchange.primary'); // SELESAI MENYIMPAN
  await expectStep(tester, 'complete');
  await tapKey(tester, 'exchange.primary'); // SELESAIKAN PENUKARAN
  await expectStep(tester, 'awaitingSync');
}

void main() {
  testWidgets('BENT finished offline after the operator step: every step is '
      'queued, the PIC sees "waiting to sync" — never "done" — and Home '
      'counts it as pending', (tester) async {
    final (h, server) = await _home(tester);
    await identifyOperatorOnline(tester);
    final syncsOnline = _syncs(h).length;
    await _offline(tester, h);

    await chooseTypes(tester);
    // Projected step, marked as saved on the tablet only.
    await expectStep(tester, 'evidence');
    expect(find.text(AppStrings.savedOffline), findsOneWidget);
    await takePhoto(tester);
    await expectStep(tester, 'newNeedle');
    await tapKey(tester, 'exchange.primary');
    await expectStep(tester, 'issue');
    await tapKey(tester, 'exchange.primary');
    await expectStep(tester, 'storeUsedNeedle');
    // Issued on the tablet only: said loudly, no success message.
    expect(find.textContaining(AppStrings.issuePendingBanner), findsOneWidget);
    expect(find.text(AppStrings.issueDone), findsNothing);
    await tapKey(tester, 'exchange.primary');
    await expectStep(tester, 'complete');
    await tapKey(tester, 'exchange.primary');

    await expectStep(tester, 'awaitingSync');
    expect(find.text(AppStrings.awaitingSyncTitle), findsOneWidget);
    expect(find.byKey(const Key('sync.state.queued')), findsOneWidget);
    expect(find.text(AppStrings.doneTitle), findsNothing);

    // Nothing left the tablet; the server did not move.
    expect(_syncs(h), hasLength(syncsOnline));
    expect(server.state, 'OPERATOR_IDENTIFIED');
    expect(server.uploadedEvidence, isEmpty);
    expect(server.stock['nt-1'], 25);
    final queue = await _queue(tester, h);
    expect(queue.map((r) => r.commandType), [
      'SELECT_EXCHANGE_TYPE',
      'SELECT_NEW_NEEDLE',
      'ISSUE_NEEDLE',
      'STORE_USED_NEEDLE',
      'COMPLETE_EXCHANGE',
    ]);
    expect(queue.map((r) => r.status), everyElement('QUEUED'));
    expect(queue.map((r) => r.commandId).toSet(), hasLength(5));
    expect((await _photos(tester, h)).single.uploadStatus, 'QUEUED');

    // Home: pending, not failed, not "all synced".
    await tapKey(tester, 'exchange.primary'); // KEMBALI KE HOME (offline)
    await waitFor(tester, find.byKey(const Key('home.syncFooter.text')));
    final footer = tester.widget<Text>(
      find.byKey(const Key('home.syncFooter.text')),
    );
    expect(footer.data, contains('${AppStrings.syncPendingLabel}: 1'));
    expect(footer.data, contains('${AppStrings.syncFailedLabel}: 0'));
    expect(footer.data, contains(AppStrings.syncOffline));
    expect(find.text(AppStrings.syncAllDone), findsNothing);
  });

  testWidgets('reconnect → the queue syncs by itself (photo before the new '
      'needle), the screen turns "done" from the server, stock moved once', (
    tester,
  ) async {
    final (h, server) = await _home(tester);
    await _finishBentOffline(tester, h);
    final before = h.backend.requests.length;

    await _online(tester, h);
    await expectStep(tester, 'done');
    expect(find.text(AppStrings.doneTitle), findsOneWidget);

    expect(server.state, 'COMPLETED');
    expect(server.stock['nt-1'], 24);
    for (final type in [
      'SELECT_EXCHANGE_TYPE',
      'SELECT_NEW_NEEDLE',
      'ISSUE_NEEDLE',
      'STORE_USED_NEEDLE',
      'COMPLETE_EXCHANGE',
    ]) {
      expect(server.executed[type], 1, reason: type);
    }
    final order = [
      for (final r in h.backend.requests.skip(before))
        if (r.path == '/mobile/sync')
          'sync:${((r.body! as Map)['commands']! as List).length}'
        else if (r.path.endsWith('/evidence') && r.method == 'POST')
          'photo',
    ];
    expect(order.take(3), ['sync:1', 'photo', 'sync:4']);
    final queue = await _queue(tester, h);
    expect(queue.map((r) => r.status), everyElement('ACCEPTED'));
    expect(await _photos(tester, h), isEmpty);
  });

  testWidgets('insufficient stock at sync: ISSUE is rejected, the steps '
      'behind it are dropped, the PIC is back at the issue step with the '
      'stock message, the exchange left at NEW_NEEDLE_SELECTED', (
    tester,
  ) async {
    final (h, server) = await _home(tester);
    await identifyOperatorOnline(tester);
    await chooseTypes(tester);
    await takePhoto(tester);
    await expectStep(tester, 'newNeedle');
    await tapKey(tester, 'exchange.primary'); // accepted online
    await expectStep(tester, 'issue');
    expect(server.state, 'NEW_NEEDLE_SELECTED');

    await _offline(tester, h);
    await tapKey(tester, 'exchange.primary'); // issue (queued)
    await expectStep(tester, 'storeUsedNeedle');
    await tapKey(tester, 'exchange.primary'); // store (queued)
    await expectStep(tester, 'complete');
    await tapKey(tester, 'exchange.primary'); // complete (queued)
    await expectStep(tester, 'awaitingSync');

    // Meanwhile the trolley ran out.
    server.stock['nt-1'] = 0;
    await _online(tester, h);

    await expectStep(tester, 'issue');
    await waitFor(tester, find.byKey(const Key('exchange.stockProblem')));
    expect(find.textContaining(AppStrings.stockUnavailable), findsOneWidget);
    expect(
      find.textContaining('${AppStrings.stockAvailableLabel}: 0'),
      findsOneWidget,
    );
    expect(find.text(AppStrings.doneTitle), findsNothing);
    expect(server.state, 'NEW_NEEDLE_SELECTED');
    expect(server.executed['ISSUE_NEEDLE'], isNull);
    expect(server.executed['STORE_USED_NEEDLE'], isNull);
    // The halted steps were never executed; they are gone, nothing waits.
    final queue = await _queue(tester, h);
    expect(queue.map((r) => r.status), everyElement('ACCEPTED'));
    expect(queue.map((r) => r.commandType), isNot(contains('ISSUE_NEEDLE')));
  });

  testWidgets('BROKEN + NOT_FOUND offline: waiting for approval; the '
      "approver's decision arrives through the pull and opens the photo step", (
    tester,
  ) async {
    final (h, server) = await _home(tester);
    await identifyOperatorOnline(tester);
    await _offline(tester, h);
    await chooseTypes(tester, code: 'BROKEN');
    await expectStep(tester, 'fragmentCheck');
    await tapKey(tester, 'exchange.fragment.notFound');

    await expectStep(tester, 'awaitingConfirmation');
    expect(find.text(AppStrings.awaitingQueuedBody), findsOneWidget);
    expect(server.state, 'OPERATOR_IDENTIFIED');

    await _online(tester, h);
    for (var i = 0; i < 20 && server.state != 'CONFIRMATION_PENDING'; i++) {
      await settle(tester, rounds: 2);
    }
    expect(server.state, 'CONFIRMATION_PENDING');
    await expectStep(tester, 'awaitingConfirmation');

    server.confirmationStatus = 'APPROVED';
    final confirmationReads = h.backend
        .requestsTo('GET', '/confirmations/$confirmationId')
        .length;
    final container = ProviderScope.containerOf(
      tester.element(find.byType(ExchangeFlowScreen)),
    );
    await tester.runAsync(
      () => container.read(syncControllerProvider.notifier).syncNow(),
    );
    await settle(tester);

    await expectStep(tester, 'evidence');
    expect(find.text(AppStrings.confirmationApproved), findsOneWidget);
    expect(
      h.backend.requestsTo('GET', '/confirmations/$confirmationId'),
      hasLength(confirmationReads),
      reason: 'the decision came with the pull',
    );
  });

  testWidgets('a rejected item on the Pending Sync screen: reason shown, '
      '"COBA LAGI" resends the same command once the trolley is refilled', (
    tester,
  ) async {
    final (h, server) = await _home(tester);
    await identifyOperatorOnline(tester);
    await chooseTypes(tester);
    await takePhoto(tester);
    await tapKey(tester, 'exchange.primary'); // new needle (online)
    await expectStep(tester, 'issue');
    await _offline(tester, h);
    await tapKey(tester, 'exchange.primary'); // issue
    await tapKey(tester, 'exchange.primary'); // store
    await tapKey(tester, 'exchange.primary'); // complete
    await expectStep(tester, 'awaitingSync');
    await tapKey(tester, 'exchange.primary'); // KEMBALI KE HOME
    await waitFor(tester, find.byKey(const Key('home.syncFooter.text')));

    server.stock['nt-1'] = 0;
    await _online(tester, h); // syncs from Home: ISSUE rejected
    final footer = find.byKey(const Key('home.syncFooter.text'));
    await waitFor(
      tester,
      find.textContaining('${AppStrings.syncFailedLabel}: 1'),
    );
    expect(tester.widget<Text>(footer).data, contains(AppStrings.syncError));

    await tapKey(tester, 'home.syncFooter');
    final ctx = await _ctx(tester, h);
    await waitFor(tester, find.byKey(Key('sync.item.$ctx')));
    expect(find.byKey(const Key('sync.state.serverRejected')), findsOneWidget);
    expect(
      find.text('Stock jarum yang dipilih tidak tersedia pada trolley.'),
      findsOneWidget,
    );
    final issueId = (await _queue(
      tester,
      h,
    )).firstWhere((r) => r.commandType == 'ISSUE_NEEDLE').commandId;

    server.stock['nt-1'] = 5;
    await tapKey(tester, 'sync.retry.$ctx');
    await waitFor(tester, find.text(AppStrings.syncScreenEmpty));
    expect(find.byKey(Key('sync.item.$ctx')), findsNothing);
    expect(server.state, 'COMPLETED');
    expect(server.stock['nt-1'], 4);
    expect(server.executed['ISSUE_NEEDLE'], 1);
    expect(
      server.syncCommands
          .where((c) => c['commandType'] == 'ISSUE_NEEDLE')
          .map((c) => c['commandId'])
          .toSet(),
      {issueId},
    );
  });

  testWidgets('restart while offline with queued steps and a queued photo: '
      'Home reopens the exchange at the projected step; back online the '
      'photo and the steps go out in order', (tester) async {
    final h = TestHarness.provisioned();
    final server = FakeExchangeServer(h.backend)..install();
    await seedPreviousSession(h);
    // The server knows the exchange up to the operator (sent online before
    // the app was killed).
    server
      ..clientTransactionId = 'ctid-restart'
      ..exchange = {
        ...server.newExchange(status: 'OPERATOR_IDENTIFIED'),
        'operatorId': 'emp-1',
      };
    final photo = File('${h.evidenceDir.path}/kept.jpg')
      ..writeAsBytesSync([0xFF, 0xD8, 1, 2, 0xFF, 0xD9]);
    final now = DateTime(2026, 9, 28, 8);
    await tester.runAsync(() async {
      final db = h.database;
      await db
          .into(db.localExchange)
          .insert(
            LocalExchangeCompanion.insert(
              clientTransactionId: 'ctid-restart',
              createIdempotencyKey: 'create-key',
              deviceId: deviceId,
              serverExchangeId: const Value(exchangeId),
              exchangeNumber: const Value('EXC-20260925-000001'),
              lastKnownStatus: const Value('OPERATOR_IDENTIFIED'),
              serverSnapshot: Value(jsonEncode(server.exchange)),
              operatorEmployeeNumber: const Value('EMP001'),
              operatorName: const Value('Siti Operator'),
              createdAt: now,
              updatedAt: now,
            ),
          );
      await db
          .into(db.localSyncQueue)
          .insert(
            LocalSyncQueueCompanion.insert(
              commandId: 'cmd-type',
              clientTransactionId: 'ctid-restart',
              commandType: 'SELECT_EXCHANGE_TYPE',
              payload: const Value(
                '{"exchangeTypeId":"et-bent","oldNeedleTypeId":"nt-1"}',
              ),
              occurredAt: now,
              status: 'QUEUED',
              createdAt: now,
              updatedAt: now,
            ),
          );
      await db
          .into(db.localExchangeEvidence)
          .insert(
            LocalExchangeEvidenceCompanion.insert(
              id: 'ev-kept',
              clientTransactionId: 'ctid-restart',
              evidenceType: 'OLD_NEEDLE',
              filePath: photo.path,
              mimeType: 'image/jpeg',
              byteSize: 6,
              capturedAt: now,
              idempotencyKey: 'photo-key',
              uploadStatus: 'QUEUED',
            ),
          );
    });
    h.connectivity.status = ConnectivityStatus.offline;
    await h.pumpApp(tester);

    // Auto-resumed at the projected step, marked as waiting to sync; the
    // step came from the tablet's copy, no request was made.
    await expectStep(tester, 'newNeedle');
    expect(find.byKey(const Key('exchange.pendingSync')), findsOneWidget);
    expect(h.backend.requestsTo('POST', '/mobile/sync'), isEmpty);
    expect(h.backend.requestsTo('POST', '/exchanges'), isEmpty);

    await _online(tester, h);
    for (var i = 0; i < 20 && server.state != 'EVIDENCE_CAPTURED'; i++) {
      await settle(tester, rounds: 2);
    }
    expect(server.state, 'EVIDENCE_CAPTURED');
    expect(server.uploadedEvidence, ['OLD_NEEDLE']);
    final upload = h.backend
        .requestsTo('POST', '/exchanges/$exchangeId/evidence')
        .single;
    expect(upload.header('Idempotency-Key'), 'photo-key');
    expect(server.syncCommands.single['commandId'], 'cmd-type');
    expect(photo.existsSync(), isFalse);
    // Now confirmed by the server: the step stays, the warning goes.
    await expectStep(tester, 'newNeedle');
    for (var i = 0; i < 10; i++) {
      if (find.byKey(const Key('exchange.pendingSync')).evaluate().isEmpty) {
        break;
      }
      await settle(tester, rounds: 2);
    }
    expect(find.byKey(const Key('exchange.pendingSync')), findsNothing);
  });

  testWidgets('Galaxy Tab A7 Lite size (1006x553 dp): Home with the sync '
      'footer and the Pending Sync screen lay out without overflow', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(1006, 553);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final h = TestHarness.provisioned();
    FakeExchangeServer(h.backend).install();
    await seedPreviousSession(h);
    await h.pumpApp(tester, overrideView: false);
    await _finishBentOffline(tester, h);
    expect(tester.takeException(), isNull);
    await tapKey(tester, 'exchange.primary'); // KEMBALI KE HOME
    await waitFor(tester, find.byKey(const Key('home.syncFooter')));
    expect(tester.takeException(), isNull);
    await tapKey(tester, 'home.syncFooter');
    await waitFor(tester, find.byKey(const Key('sync.summary')));
    expect(find.byKey(const Key('sync.state.queued')), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
