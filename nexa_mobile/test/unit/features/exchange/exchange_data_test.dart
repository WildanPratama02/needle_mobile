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
import 'package:nexa_mobile/features/exchange/data/exchange_providers.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_repository_impl.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';

import '../../../helpers/fake_backend.dart';
import '../../../helpers/fake_exchange_server.dart';
import '../../../helpers/fakes.dart';
import '../../../helpers/fixtures.dart';
import '../../../helpers/test_app.dart';

void main() {
  late FakeBackend backend;
  late AppDatabase db;
  late Directory dir;
  late ProviderContainer container;

  setUp(() {
    backend = FakeBackend();
    db = inMemoryDatabase();
    dir = Directory.systemTemp.createTempSync('nexa_data_test');
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
  });

  tearDown(() async {
    await db.close();
    if (dir.existsSync()) dir.deleteSync(recursive: true);
  });

  group('ExchangeRepositoryImpl', () {
    ExchangeRepository repo() => container.read(exchangeRepositoryProvider);

    test('create sends the context ids + clientTransactionId and the '
        'Idempotency-Key; parses the canonical state', () async {
      final server = FakeExchangeServer(backend)..install();
      final result = await repo().create(
        clientTransactionId: 'ctid-1',
        factoryId: 'factory-1',
        trolleyId: 'trolley-1',
        deviceId: deviceId,
        idempotencyKey: 'key-create',
      );
      final exchange = (result as CommandOk<ExchangeSnapshot>).value;
      expect(exchange.state, ExchangeState.created);
      expect(exchange.id, exchangeId);
      final request = backend.requestsTo('POST', '/exchanges').single;
      expect(request.header('Idempotency-Key'), 'key-create');
      expect(request.header('X-Device-ID'), deviceId);
      expect(request.body, {
        'clientTransactionId': 'ctid-1',
        'factoryId': 'factory-1',
        'trolleyId': 'trolley-1',
        'deviceId': deviceId,
      });
      expect(server.state, 'CREATED');
    });

    test('a 5xx is retried with the SAME key; a 409 is not retried', () async {
      var calls = 0;
      backend.on('POST', '/exchanges/e1/issue', (_) {
        calls++;
        return calls < 3
            ? const FakeResponse(503)
            : FakeResponse.ok(
                FakeExchangeServer(backend)
                    .newExchange(status: 'NEEDLE_ISSUED'),
              );
      });
      final ok = await repo().issue('e1', idempotencyKey: 'key-issue');
      expect(ok, isA<CommandOk<ExchangeSnapshot>>());
      final sent = backend.requestsTo('POST', '/exchanges/e1/issue');
      expect(sent, hasLength(3));
      expect(sent.map((r) => r.header('Idempotency-Key')).toSet(), {
        'key-issue',
      });

      backend.on(
        'POST',
        '/exchanges/e1/complete',
        (_) => FakeResponse.error(
          409,
          'EXCHANGE_INVALID_STATE',
          context: {'currentState': 'NEEDLE_ISSUED', 'action': 'COMPLETE'},
        ),
      );
      final rejected = await repo().complete('e1', idempotencyKey: 'k');
      expect(
        (rejected as CommandFailed<ExchangeSnapshot>).error.code,
        BackendErrorCodes.exchangeInvalidState,
      );
      expect(
        backend.requestsTo('POST', '/exchanges/e1/complete'),
        hasLength(1),
      );
    });

    test('issue sends no quantity (backend default 1, Doc 07 §24)', () async {
      backend.on(
        'POST',
        '/exchanges/e1/issue',
        (_) => FakeResponse.ok(
          FakeExchangeServer(backend).newExchange(status: 'NEEDLE_ISSUED'),
        ),
      );
      await repo().issue('e1', idempotencyKey: 'k');
      final body = backend
          .requestsTo('POST', '/exchanges/e1/issue')
          .single
          .body;
      expect((body! as Map<String, Object?>).containsKey('quantity'), isFalse);
    });

    test(
      'confirmation parse: status, exchange state, rejection reason',
      () async {
        final server = FakeExchangeServer(backend)
          ..install()
          ..exchange = FakeExchangeServer(backend)
              .newExchange(status: 'CONFIRMATION_PENDING')
          ..confirmationStatus = 'REJECTED'
          ..rejectionReason = 'Cari patahan dulu';
        expect(server.state, 'CONFIRMATION_PENDING');
        final result = await repo().fetchConfirmation(confirmationId);
        final confirmation = (result as CommandOk<ConfirmationSnapshot>).value;
        expect(confirmation.status, ConfirmationStatus.rejected);
        expect(confirmation.exchangeState, ExchangeState.confirmationPending);
        expect(confirmation.rejectionReason, 'Cari patahan dulu');
      },
    );

    test('an unknown status is a malformed response, not a crash', () async {
      backend.on(
        'GET',
        '/exchanges/e1',
        (_) => FakeResponse.ok({
          ...FakeExchangeServer(backend).newExchange(),
          'status': 'DRAFT',
        }),
      );
      final result = await repo().fetch('e1');
      expect(
        (result as CommandFailed<ExchangeSnapshot>).error.code,
        ClientErrorCodes.malformedResponse,
      );
    });
  });

  group('ActiveExchangeStore (local_exchange)', () {
    ActiveExchangeStore store() => container.read(activeExchangeStoreProvider);

    test('begin → record server state/operator → current → finish', () async {
      await store().begin(
        const LocalExchangeRecord(
          clientTransactionId: 'ctid-1',
          createIdempotencyKey: 'key-1',
          deviceId: deviceId,
        ),
      );
      var current = await store().current(deviceId);
      expect(current!.serverExchangeId, isNull);
      expect(current.createIdempotencyKey, 'key-1');

      await store().recordServerState(
        'ctid-1',
        const ExchangeSnapshot(
          id: 'e1',
          exchangeNumber: 'EXC-1',
          state: ExchangeState.operatorIdentified,
          factoryId: 'f',
          trolleyId: 't',
          deviceId: deviceId,
        ),
      );
      await store().recordOperator(
        'ctid-1',
        const OperatorIdentity(employeeNumber: 'EMP001', name: 'Siti'),
      );
      current = await store().current(deviceId);
      expect(current!.serverExchangeId, 'e1');
      expect(current.exchangeNumber, 'EXC-1');
      expect(current.lastKnownState, ExchangeState.operatorIdentified);
      expect(current.operator!.name, 'Siti');

      await store().finish('ctid-1');
      expect(await store().current(deviceId), isNull);
    });

    test('a row of another device is never resumed and is dropped', () async {
      await store().begin(
        const LocalExchangeRecord(
          clientTransactionId: 'old',
          createIdempotencyKey: 'k',
          deviceId: 'other-device',
        ),
      );
      expect(await store().current(deviceId), isNull);
      expect(await db.select(db.localExchange).get(), isEmpty);
    });
  });

  group('EvidenceRepositoryImpl (local copy until confirmed)', () {
    late FakeEvidenceCamera camera;

    setUp(() => camera = FakeEvidenceCamera(dir));

    Future<LocalEvidence> keep([
      EvidenceType type = EvidenceType.oldNeedle,
    ]) async {
      final photo = (await camera.capture())!;
      return container
          .read(evidenceRepositoryProvider)
          .keep(clientTransactionId: 'ctid-1', type: type, photo: photo);
    }

    test('keep moves the photo into app storage with its own key', () async {
      final kept = await keep();
      expect(File(kept.filePath).existsSync(), isTrue);
      expect(File('${dir.path}/camera_1.jpg').existsSync(), isFalse);
      expect(kept.byteSize, camera.bytes.length);
      expect(kept.idempotencyKey, isNotEmpty);
      final pending = await container
          .read(evidenceRepositoryProvider)
          .pending('ctid-1');
      expect(pending.single.id, kept.id);
    });

    test('a retake replaces the unconfirmed photo of the same type', () async {
      final first = await keep();
      final second = await keep();
      expect(File(first.filePath).existsSync(), isFalse);
      expect(second.idempotencyKey, isNot(first.idempotencyKey));
      final pending = await container
          .read(evidenceRepositoryProvider)
          .pending('ctid-1');
      expect(pending.map((e) => e.id), [second.id]);
    });

    test('failed upload keeps file + key; the resend reuses the key; success '
        'deletes both', () async {
      final kept = await keep();
      var fail = true;
      backend.on('POST', '/exchanges/e1/evidence', (_) {
        if (fail) return const FakeResponse.networkError();
        return FakeResponse.ok({
          'exchangeStatus': 'EVIDENCE_CAPTURED',
          'outstanding': <String>[],
        }, status: 201);
      });
      final repo = container.read(evidenceRepositoryProvider);

      final failed = await repo.upload('e1', kept);
      expect(failed, isA<CommandFailed<EvidenceUploadResult>>());
      expect(File(kept.filePath).existsSync(), isTrue);
      final stored = (await repo.pending('ctid-1')).single;
      expect(stored.status, LocalEvidenceStatus.uploadFailed);
      expect(stored.idempotencyKey, kept.idempotencyKey);

      fail = false;
      final ok = await repo.upload('e1', stored);
      final result = (ok as CommandOk<EvidenceUploadResult>).value;
      expect(result.exchangeState, ExchangeState.evidenceCaptured);
      expect(File(kept.filePath).existsSync(), isFalse);
      expect(await repo.pending('ctid-1'), isEmpty);

      final keys = backend
          .requestsTo('POST', '/exchanges/e1/evidence')
          .map((r) => r.header('Idempotency-Key'))
          .toSet();
      expect(keys, {kept.idempotencyKey});
    });

    test('over 10 MB is refused locally, never sent', () async {
      camera.bytes = List<int>.filled(EvidenceFilePolicy.maxBytes + 1, 0);
      final kept = await keep();
      final result = await container
          .read(evidenceRepositoryProvider)
          .upload('e1', kept);
      expect(
        (result as CommandFailed<EvidenceUploadResult>).error.code,
        evidenceFileInvalidCode,
      );
      expect(backend.requests, isEmpty);
    });

    test('discardAll removes every local photo of the exchange', () async {
      await keep();
      await keep(EvidenceType.brokenFragment);
      final repo = container.read(evidenceRepositoryProvider);
      await repo.discardAll('ctid-1');
      expect(await repo.pending('ctid-1'), isEmpty);
      expect(Directory('${dir.path}/ctid-1').existsSync(), isFalse);
    });

    test('uploadedTypes counts UPLOADED rows only', () async {
      backend.on(
        'GET',
        '/exchanges/e1/evidence',
        (_) => FakeResponse.ok([
          {'evidenceType': 'OLD_NEEDLE', 'status': 'UPLOADED'},
          {'evidenceType': 'BROKEN_FRAGMENT', 'status': 'FAILED'},
        ]),
      );
      final result = await container
          .read(evidenceRepositoryProvider)
          .uploadedTypes('e1');
      expect((result as CommandOk<List<EvidenceType>>).value, [
        EvidenceType.oldNeedle,
      ]);
    });
  });
}
