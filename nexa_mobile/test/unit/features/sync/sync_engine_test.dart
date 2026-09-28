import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_providers.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_engine.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fake_exchange_server.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

const ctx = 'ctid-1';

/// The engine over the real Drift queue/stores and the real HTTP stack,
/// against a fake backend that runs `/mobile/sync` like `sync.service.ts`.
class _Harness {
  _Harness() {
    server = FakeExchangeServer(backend)..install();
    container = ProviderContainer.test(
      overrides: [
        appConfigProvider.overrideWithValue(testConfig),
        secureStoreProvider.overrideWithValue(
          InMemorySecureStore({
            SecureStoreKeys.accessToken: 'access-0',
            SecureStoreKeys.refreshToken: 'refresh-0',
            SecureStoreKeys.deviceId: deviceId,
          }),
        ),
        httpClientAdapterProvider.overrideWithValue(backend),
        appDatabaseProvider.overrideWithValue(db),
        retryPolicyProvider.overrideWithValue(const RetryPolicy.immediate()),
        evidenceDirectoryProvider.overrideWithValue(() async => dir),
      ],
    );
  }

  final backend = FakeBackend();
  late final FakeExchangeServer server;
  final AppDatabase db = inMemoryDatabase();
  final Directory dir = Directory.systemTemp.createTempSync('nexa_sync_test');
  late final ProviderContainer container;
  DateTime now = DateTime(2026, 9, 28, 8);

  late final SyncEngine engine = SyncEngine(
    queue: queue,
    gateway: container.read(syncGatewayProvider),
    checkpoints: container.read(syncCheckpointStoreProvider),
    exchanges: store,
    evidence: evidence,
    masterData: container.read(masterDataRefresherProvider),
    now: () => now,
  );

  SyncQueue get queue => container.read(syncQueueProvider);
  ActiveExchangeStore get store => container.read(activeExchangeStoreProvider);
  EvidenceRepository get evidence => container.read(evidenceRepositoryProvider);

  Future<void> dispose() async {
    await db.close();
    if (dir.existsSync()) dir.deleteSync(recursive: true);
  }

  /// This tablet's exchange, known to the (fake) server at [status].
  Future<void> seedExchange(
    String status, {
    String type = 'BENT',
    Map<String, Object?> extra = const {},
    ConfirmationStatus? confirmation,
  }) async {
    server
      ..clientTransactionId = ctx
      ..exchange = {
        ...server.newExchange(status: status),
        'operatorId': 'emp-1',
        if (status != 'OPERATOR_IDENTIFIED') ...{
          'exchangeTypeId': type == 'BENT' ? 'et-bent' : 'et-broken',
          'exchangeTypeCode': type,
          'exchangeTypeName': type,
          'oldNeedleTypeId': 'nt-1',
        },
        ...extra,
      };
    await store.begin(
      const LocalExchangeRecord(
        clientTransactionId: ctx,
        createIdempotencyKey: 'create-key',
        deviceId: deviceId,
      ),
    );
    await store.recordServerState(
      ctx,
      parseExchange(server.exchange),
      confirmation: ConfirmationUpdate(confirmation),
    );
  }

  Future<SyncCommand> enqueue(
    SyncCommandType type, [
    Map<String, Object?> payload = const {},
  ]) => queue.enqueue(
    clientTransactionId: ctx,
    type: type,
    payload: payload,
    occurredAt: now,
  );

  Future<LocalEvidence> queuedPhoto(EvidenceType type) async {
    final file = File('${dir.path}/cam_${type.wire}.jpg')
      ..writeAsBytesSync([0xFF, 0xD8, 1, 2, 3, 0xFF, 0xD9]);
    final kept = await evidence.keep(
      clientTransactionId: ctx,
      type: type,
      photo: CapturedPhoto(
        path: file.path,
        mimeType: 'image/jpeg',
        capturedAt: now,
      ),
    );
    return evidence.markQueued(kept);
  }

  Future<SyncRunReport> run({bool manual = false}) => engine.run(
    deviceId: deviceId,
    bootstrapCursor: 'cursor-1',
    manual: manual,
  );

  List<RecordedRequest> get syncRequests =>
      backend.requestsTo('POST', '/mobile/sync');

  List<String> typesOf(RecordedRequest r) => [
    for (final c
        in ((r.body! as Map)['commands']! as List).cast<Map<String, Object?>>())
      c['commandType']! as String,
  ];

  Future<Map<String, SyncCommandStatus>> statuses() async => {
    for (final c in await queue.commandsFor(ctx)) c.type.wire: c.status,
  };
}

void main() {
  late _Harness h;
  setUp(() => h = _Harness());
  tearDown(() => h.dispose());

  group('request shape (Docs/12 §19)', () {
    test('deviceId + cursor + commands; no Idempotency-Key; X-Device-ID; the '
        'first pull starts from the bootstrap cursor', () async {
      await h.seedExchange('OPERATOR_IDENTIFIED');
      final type = await h.enqueue(SyncCommandType.selectExchangeType, {
        'exchangeTypeId': 'et-bent',
        'oldNeedleTypeId': 'nt-1',
      });
      await h.run();

      final request = h.syncRequests.first;
      expect(request.header('Idempotency-Key'), isNull);
      expect(request.header('X-Device-ID'), deviceId);
      final body = request.body! as Map<String, Object?>;
      expect(body['deviceId'], deviceId);
      expect(body['cursor'], 'cursor-1');
      expect(body['commands'], [
        {
          'commandId': type.commandId,
          'clientTransactionId': ctx,
          'commandType': 'SELECT_EXCHANGE_TYPE',
          'occurredAt': h.now.toUtc().toIso8601String(),
          'payload': {'exchangeTypeId': 'et-bent', 'oldNeedleTypeId': 'nt-1'},
        },
      ]);
      expect(await h.statuses(), {
        'SELECT_EXCHANGE_TYPE': SyncCommandStatus.accepted,
      });
      final record = await h.store.byId(ctx);
      expect(record!.lastKnownState, ExchangeState.exchangeTypeSelected);
    });
  });

  group('result statuses', () {
    test('SUCCESS → accepted and the authoritative exchange is stored; a lost '
        'answer is resent with the SAME commandId → IDEMPOTENT_SUCCESS, '
        'executed once', () async {
      await h.seedExchange(
        'NEW_NEEDLE_SELECTED',
        extra: {'newNeedleTypeId': 'nt-1'},
      );
      final issue = await h.enqueue(SyncCommandType.issueNeedle);
      h.server.dropSyncAnswers = 1;

      final lost = await h.run();
      expect(lost.requestError?.code, ClientErrorCodes.networkTimeout);
      var queued = (await h.queue.byId(issue.commandId))!;
      expect(queued.status, SyncCommandStatus.queued);
      expect(queued.attemptCount, 1);
      expect(queued.lastResult, 'NETWORK');
      expect(h.server.stock['nt-1'], 24, reason: 'the server did execute it');

      await h.run(); // first retry is immediate: due now
      queued = (await h.queue.byId(issue.commandId))!;
      expect(queued.status, SyncCommandStatus.accepted);
      expect(queued.lastResult, 'IDEMPOTENT_SUCCESS');
      expect(h.server.executed['ISSUE_NEEDLE'], 1);
      expect(h.server.stock['nt-1'], 24, reason: 'stock moved exactly once');
      final ids = [
        for (final r in h.syncRequests)
          for (final c
              in ((r.body! as Map)['commands']! as List)
                  .cast<Map<String, Object?>>())
            c['commandId'],
      ];
      expect(ids, [issue.commandId, issue.commandId]);
      expect(
        (await h.store.byId(ctx))!.lastKnownState,
        ExchangeState.needleIssued,
      );
    });

    test('REJECTED halts the rest of the exchange (SKIPPED stays queued), is '
        'never resent automatically, and keeps the authoritative state; other '
        'exchanges carry on', () async {
      await h.seedExchange(
        'NEW_NEEDLE_SELECTED',
        extra: {'newNeedleTypeId': 'nt-1'},
      );
      h.server.stock['nt-1'] = 0;
      // Another exchange of this tablet that the server does not know.
      await h.store.begin(
        const LocalExchangeRecord(
          clientTransactionId: 'ctid-2',
          createIdempotencyKey: 'k2',
          deviceId: deviceId,
        ),
      );
      final other = await h.queue.enqueue(
        clientTransactionId: 'ctid-2',
        type: SyncCommandType.storeUsedNeedle,
        occurredAt: h.now,
      );
      final issue = await h.enqueue(SyncCommandType.issueNeedle);
      await h.enqueue(SyncCommandType.storeUsedNeedle);
      await h.enqueue(SyncCommandType.completeExchange);

      final report = await h.run();
      expect(report.rejected, 2);
      expect(h.typesOf(h.syncRequests.single), [
        'STORE_USED_NEEDLE',
        'ISSUE_NEEDLE',
        'STORE_USED_NEEDLE',
        'COMPLETE_EXCHANGE',
      ]);
      final rejected = (await h.queue.byId(issue.commandId))!;
      expect(rejected.status, SyncCommandStatus.rejected);
      expect(
        rejected.lastError!.code,
        BackendErrorCodes.inventoryInsufficientStock,
      );
      expect(rejected.lastError!.context['availableQuantity'], 0);
      final later = await h.queue.commandsFor(ctx);
      expect(later.skip(1).map((c) => c.status), [
        SyncCommandStatus.queued,
        SyncCommandStatus.queued,
      ]);
      expect(later.skip(1).map((c) => c.lastResult), ['SKIPPED', 'SKIPPED']);
      expect(
        (await h.queue.byId(other.commandId))!.lastError!.code,
        BackendErrorCodes.exchangeNotFound,
      );
      // The exchange stays where the server has it.
      expect(
        (await h.store.byId(ctx))!.lastKnownState,
        ExchangeState.newNeedleSelected,
      );

      // Next run: nothing of the halted exchanges is sent.
      await h.run();
      expect(h.typesOf(h.syncRequests.last), isEmpty);
      expect(h.server.executed['ISSUE_NEEDLE'], isNull);
    });

    test('FAILED stays queued with the backoff schedule; "retry now" ignores '
        'the delay; the command id never changes', () async {
      await h.seedExchange(
        'NEW_NEEDLE_SELECTED',
        extra: {'newNeedleTypeId': 'nt-1'},
      );
      final issue = await h.enqueue(SyncCommandType.issueNeedle);
      await h.enqueue(SyncCommandType.storeUsedNeedle);
      h.server.failingCommandTypes.add('ISSUE_NEEDLE');

      // First failure: the retry is due immediately (the controller's
      // due-timer fires it); the step behind it was not attempted.
      await h.run();
      var cmd = (await h.queue.byId(issue.commandId))!;
      expect(cmd.status, SyncCommandStatus.queued);
      expect(cmd.lastResult, 'FAILED');
      expect(cmd.attemptCount, 1);
      expect(cmd.nextAttemptAt, h.now);
      expect(h.syncRequests, hasLength(1));
      expect((await h.queue.commandsFor(ctx)).last.lastResult, 'SKIPPED');

      // The immediate retry fails too → 5 s.
      await h.run();
      cmd = (await h.queue.byId(issue.commandId))!;
      expect(cmd.attemptCount, 2);
      expect(cmd.nextAttemptAt, h.now.add(const Duration(seconds: 5)));
      expect(await h.engine.nextAttemptAt(), cmd.nextAttemptAt);

      // Not due yet: the exchange sends nothing (pull only).
      await h.run();
      expect(h.typesOf(h.syncRequests.last), isEmpty);

      // Due: third failure → 15 s.
      h.now = h.now.add(const Duration(seconds: 5));
      await h.run();
      cmd = (await h.queue.byId(issue.commandId))!;
      expect(cmd.attemptCount, 3);
      expect(cmd.nextAttemptAt, h.now.add(const Duration(seconds: 15)));

      // The PIC presses "retry now" and the server is fine again.
      h.server.failingCommandTypes.clear();
      await h.run(manual: true);
      expect(await h.statuses(), {
        'ISSUE_NEEDLE': SyncCommandStatus.accepted,
        'STORE_USED_NEEDLE': SyncCommandStatus.accepted,
      });
      final sentIds = {
        for (final c in h.server.syncCommands)
          if (c['commandType'] == 'ISSUE_NEEDLE') c['commandId'],
      };
      expect(sentIds, {issue.commandId});
      expect(h.server.executed['ISSUE_NEEDLE'], 1);
    });

    test(
      'whole request 403 DEVICE_INACTIVE: nothing counted as an attempt',
      () async {
        await h.seedExchange(
          'NEW_NEEDLE_SELECTED',
          extra: {'newNeedleTypeId': 'nt-1'},
        );
        final issue = await h.enqueue(SyncCommandType.issueNeedle);
        h.server.interceptSync = (_) => FakeResponse.error(
          403,
          'DEVICE_INACTIVE',
          context: {'status': 'REVOKED'},
        );
        final report = await h.run();
        expect(report.requestFailure, SyncRequestFailure.deviceBlocked);
        final cmd = (await h.queue.byId(issue.commandId))!;
        expect(cmd.attemptCount, 0);
        expect(cmd.status, SyncCommandStatus.queued);
      },
    );
  });

  group('photos before the commands that need them (MG-7)', () {
    test('type is sent, then the photo is uploaded, then the new needle and '
        'the rest', () async {
      await h.seedExchange('OPERATOR_IDENTIFIED');
      await h.enqueue(SyncCommandType.selectExchangeType, {
        'exchangeTypeId': 'et-bent',
        'oldNeedleTypeId': 'nt-1',
      });
      await h.queuedPhoto(EvidenceType.oldNeedle);
      await h.enqueue(SyncCommandType.selectNewNeedle, {
        'needleTypeId': 'nt-1',
      });
      await h.enqueue(SyncCommandType.issueNeedle);

      await h.run();

      final order = [
        for (final r in h.backend.requests)
          if (r.path == '/mobile/sync')
            'sync:${h.typesOf(r).join('+')}'
          else if (r.path.endsWith('/evidence'))
            'photo',
      ];
      expect(order, [
        'sync:SELECT_EXCHANGE_TYPE',
        'photo',
        'sync:SELECT_NEW_NEEDLE+ISSUE_NEEDLE',
      ]);
      expect(h.server.uploadedEvidence, ['OLD_NEEDLE']);
      expect(await h.evidence.awaitingUpload(), isEmpty);
      expect(
        h.dir
            .listSync(recursive: true)
            .whereType<File>()
            .where((f) => f.path.contains(ctx)),
        isEmpty,
        reason: 'deleted once the upload was confirmed',
      );
      expect(h.server.state, 'NEEDLE_ISSUED');
      expect(
        (await h.store.byId(ctx))!.lastKnownState,
        ExchangeState.needleIssued,
      );
    });

    test('SELECT_NEW_NEEDLE refused for missing evidence while a photo waits '
        '→ upload, then resend as is (not a rejection)', () async {
      await h.seedExchange('EXCHANGE_TYPE_SELECTED');
      final newNeedle = await h.enqueue(SyncCommandType.selectNewNeedle, {
        'needleTypeId': 'nt-1',
      });
      // The PIC accepts the photo while the request is already in flight.
      late LocalEvidence photo;
      final file = File('${h.dir.path}/late.jpg')..writeAsBytesSync([1, 2, 3]);
      photo = await h.evidence.keep(
        clientTransactionId: ctx,
        type: EvidenceType.oldNeedle,
        photo: CapturedPhoto(
          path: file.path,
          mimeType: 'image/jpeg',
          capturedAt: h.now,
        ),
      );
      var first = true;
      h.server.interceptSync = (_) {
        if (first) {
          first = false;
          // Runs inside the request, before the server answers.
          h.evidence.markQueued(photo);
        }
        return null;
      };

      final report = await h.run();
      expect(report.rejected, 0);
      final cmd = (await h.queue.byId(newNeedle.commandId))!;
      expect(cmd.status, SyncCommandStatus.accepted);
      expect(cmd.attemptCount, 0, reason: 'not a technical failure either');
      expect(h.server.uploadedEvidence, ['OLD_NEEDLE']);
      final sent = [
        for (final c in h.server.syncCommands)
          if (c['commandType'] == 'SELECT_NEW_NEEDLE') c['commandId'],
      ];
      expect(sent, [newNeedle.commandId, newNeedle.commandId]);
      expect(h.server.state, 'NEW_NEEDLE_SELECTED');
    });
  });

  group('pull (cursor, hasMore, changes.exchanges)', () {
    test('stores nextCursor; hasMore pulls again with it; the next run '
        'continues from the stored cursor', () async {
      await h.seedExchange('OPERATOR_IDENTIFIED');
      h.server.extraPullPages = 2;
      await h.run();
      final cursors = [
        for (final r in h.syncRequests) (r.body! as Map)['cursor'],
      ];
      expect(cursors, ['cursor-1', 'page-1', 'page-0']);
      final checkpoint = await h.container
          .read(syncCheckpointStoreProvider)
          .read();
      expect(checkpoint.deviceId, deviceId);
      expect(checkpoint.cursor, startsWith('fp:'));
      expect(checkpoint.lastSyncAt, h.now);

      await h.run();
      expect((h.syncRequests.last.body! as Map)['cursor'], checkpoint.cursor);
    });

    test(
      "an approver's decision reaches the tablet through the pull",
      () async {
        await h.seedExchange(
          'CONFIRMATION_PENDING',
          type: 'BROKEN',
          extra: {
            'fragmentStatus': 'NOT_FOUND',
            'confirmationId': confirmationId,
          },
          confirmation: ConfirmationStatus.pending,
        );
        h.server.confirmationStatus = 'APPROVED';
        await h.run();
        final record = (await h.store.byId(ctx))!;
        expect(record.confirmationStatus, ConfirmationStatus.approved);
        expect(record.lastKnownState, ExchangeState.confirmationPending);
        expect(
          h.backend.requestsTo('GET', '/confirmations/$confirmationId'),
          isEmpty,
        );
      },
    );

    test('a supervisor cancel reaches the tablet through the pull and closes '
        'the exchange; its waiting photos are dropped', () async {
      await h.seedExchange('EXCHANGE_TYPE_SELECTED');
      await h.queuedPhoto(EvidenceType.oldNeedle);
      h.server.exchange = {...h.server.exchange!, 'status': 'CANCELLED'};
      await h.run();
      final record = (await h.store.byId(ctx))!;
      expect(record.lastKnownState, ExchangeState.cancelled);
      expect(record.closedAt, isNotNull);
      expect(record.syncConfirmedAt, h.now);
      expect(await h.evidence.awaitingUpload(), isEmpty);
      expect(h.server.uploadedEvidence, isEmpty);
    });

    test('changed masterDataVersions refresh the catalogue through bootstrap; '
        'equal versions do not', () async {
      await h.container.read(masterDataRefresherProvider).refresh();
      final before = h.backend.requestsTo('GET', '/mobile/bootstrap').length;
      await h.seedExchange('OPERATOR_IDENTIFIED');

      await h.run();
      expect(
        h.backend.requestsTo('GET', '/mobile/bootstrap'),
        hasLength(before),
      );

      h.server.syncMasterDataVersions = {
        ...h.server.syncMasterDataVersions,
        'needleTypes': 'nv2',
      };
      await h.run();
      final bootstraps = h.backend.requestsTo('GET', '/mobile/bootstrap');
      expect(bootstraps, hasLength(before + 1));
      expect(bootstraps.last.query['needleTypesVersion'], 'nv1');
    });
  });

  group('retention (7 days after sync confirmed)', () {
    test('a completed exchange with nothing left is kept 7 days, then purged '
        'with its queue rows', () async {
      await h.seedExchange(
        'USED_NEEDLE_STORED',
        extra: {'newNeedleTypeId': 'nt-1'},
      );
      await h.enqueue(SyncCommandType.completeExchange);
      await h.run();
      final record = (await h.store.byId(ctx))!;
      expect(record.lastKnownState, ExchangeState.completed);
      expect(record.syncConfirmedAt, h.now);

      h.now = h.now.add(const Duration(days: 6, hours: 23));
      await h.run();
      expect(await h.store.byId(ctx), isNotNull);

      h.now = h.now.add(const Duration(hours: 2));
      await h.run();
      expect(await h.store.byId(ctx), isNull);
      expect(await h.queue.commandsFor(ctx), isEmpty);
    });

    test('an exchange with unsent steps is never purged', () async {
      await h.seedExchange('COMPLETED');
      await h.enqueue(SyncCommandType.storeUsedNeedle); // will be rejected
      await h.run();
      h.now = h.now.add(const Duration(days: 30));
      await h.run();
      final record = await h.store.byId(ctx);
      expect(record, isNotNull);
      expect(record!.syncConfirmedAt, isNull);
    });
  });

  test(
    'only one run in flight; a run requested meanwhile waits, then runs',
    () async {
      await h.seedExchange(
        'NEW_NEEDLE_SELECTED',
        extra: {'newNeedleTypeId': 'nt-1'},
      );
      await h.enqueue(SyncCommandType.issueNeedle);
      final a = h.run();
      expect(h.engine.isRunning, isTrue);
      final b = h.run();
      final c = h.run();
      expect(identical(b, c), isTrue, reason: 'requests coalesce');
      await Future.wait([a, b, c]);
      expect(h.server.executed['ISSUE_NEEDLE'], 1);
      expect(h.syncRequests, hasLength(2));
    },
  );
}
