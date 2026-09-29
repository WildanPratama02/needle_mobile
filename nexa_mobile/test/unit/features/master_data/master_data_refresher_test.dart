import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/device_context/data/bootstrap_master_data_refresher.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_refresher.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

class _FakeBootstrap implements BootstrapRepository {
  _FakeBootstrap(this.outcome);

  BootstrapOutcome outcome;
  int calls = 0;

  @override
  Future<BootstrapOutcome> bootstrap() async {
    calls++;
    return outcome;
  }

  @override
  Future<CachedDeviceState> cached() async => const CachedDeviceState();

  @override
  Future<void> recordStatus(DeviceStatus status) async {}
}

class _FakeMasterData implements MasterDataRepository {
  _FakeMasterData(this.versions);

  MasterDataVersions versions;

  @override
  Future<MasterDataVersions> storedVersions() async => versions;

  @override
  Future<void> apply({
    required MasterDataVersions sent,
    required MasterDataPayload received,
  }) async {}

  @override
  Future<void> clear() async {}

  @override
  Future<List<ExchangeType>> exchangeTypes() async => const [];

  @override
  Future<List<NeedleType>> needleTypes() async => const [];

  @override
  Future<List<StorageMapping>> storageMappings() async => const [];
}

const _held = MasterDataVersions({
  MasterDataCollection.needleTypes: 'nv1',
  MasterDataCollection.exchangeTypes: 'ev1',
  MasterDataCollection.storageMappings: 'sv1',
});

void main() {
  group('MasterDataVersions.differsFrom (Doc 15 §17)', () {
    test('equal versions → unchanged', () {
      expect(_held.differsFrom(_held), isFalse);
    });

    test('any collection with a new version → changed', () {
      expect(
        _held.differsFrom(
          const MasterDataVersions({MasterDataCollection.needleTypes: 'nv2'}),
        ),
        isTrue,
      );
    });

    test('a collection not reported is not a change; one not held is', () {
      expect(
        _held.differsFrom(
          const MasterDataVersions({MasterDataCollection.exchangeTypes: 'ev1'}),
        ),
        isFalse,
      );
      expect(
        const MasterDataVersions({MasterDataCollection.needleTypes: 'nv1'})
            .differsFrom(_held),
        isTrue,
      );
    });
  });

  group('BootstrapMasterDataRefresher', () {
    final snapshot = DeviceContextSnapshot(
      device: const DeviceInfo(
        id: 'd',
        code: 'c',
        name: 'n',
        status: DeviceStatus.active,
      ),
      factory: const FactoryInfo(
        id: 'f',
        code: 'F',
        name: 'F',
        timezone: 'Asia/Jakarta',
      ),
      trolley: const TrolleyInfo(
        id: 't',
        code: 'T',
        name: 'T',
        locationId: 'l',
      ),
      serverTime: DateTime.utc(2026),
      syncCursor: 'c',
      fetchedAt: DateTime(2026),
    );

    test('reported versions equal to the cache → no request', () async {
      final bootstrap = _FakeBootstrap(BootstrapSucceeded(snapshot));
      final refresher = BootstrapMasterDataRefresher(
        bootstrap,
        _FakeMasterData(_held),
      );
      expect(
        await refresher.refresh(reported: _held),
        isA<MasterDataAlreadyCurrent>(),
      );
      expect(bootstrap.calls, 0);
    });

    test('changed versions (or none reported) → re-bootstrap', () async {
      final bootstrap = _FakeBootstrap(BootstrapSucceeded(snapshot));
      final refresher = BootstrapMasterDataRefresher(
        bootstrap,
        _FakeMasterData(_held),
      );
      expect(
        await refresher.refresh(
          reported: const MasterDataVersions({
            MasterDataCollection.storageMappings: 'sv2',
          }),
        ),
        isA<MasterDataRefreshed>(),
      );
      expect(await refresher.refresh(), isA<MasterDataRefreshed>());
      expect(bootstrap.calls, 2);
    });

    test('offline keeps the cache (failure is reported, not thrown)', () async {
      final refresher = BootstrapMasterDataRefresher(
        _FakeBootstrap(
          const BootstrapUnavailable(
            AppError(
              category: ErrorCategory.network,
              code: ClientErrorCodes.networkTimeout,
              userMessage: 'x',
            ),
          ),
        ),
        _FakeMasterData(_held),
      );
      expect(await refresher.refresh(), isA<MasterDataRefreshFailed>());
    });
  });
}
