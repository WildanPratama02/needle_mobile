import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

const _needle = NeedleType(
  id: 'nt-1',
  code: 'DBX1-14',
  name: 'DBx1 #14',
  unit: 'PCS',
  minimumStock: '10.000',
);

void main() {
  const current = MasterDataVersions({
    MasterDataCollection.needleTypes: 'nv1',
    MasterDataCollection.exchangeTypes: 'ev1',
    MasterDataCollection.storageMappings: 'sv1',
  });

  group('MasterDataVersions.toQuery (Docs/12 §18)', () {
    test('sends each held version under its query parameter', () {
      expect(current.toQuery(), {
        'needleTypesVersion': 'nv1',
        'exchangeTypesVersion': 'ev1',
        'storageMappingsVersion': 'sv1',
      });
    });

    test('omits collections without a stored version', () {
      const partial = MasterDataVersions({
        MasterDataCollection.exchangeTypes: 'ev1',
      });
      expect(partial.toQuery(), {'exchangeTypesVersion': 'ev1'});
      expect(const MasterDataVersions().toQuery(), isEmpty);
    });
  });

  group('planMasterDataUpdate (Doc 15 §17)', () {
    test('first bootstrap: full lists replace the (empty) cache', () {
      final plan = planMasterDataUpdate(
        sent: const MasterDataVersions(),
        received: const MasterDataPayload(
          versions: current,
          needleTypes: [_needle],
          exchangeTypes: [],
          storageMappings: [],
        ),
      );
      expect(plan.values, everyElement(isA<ReplaceCollection>()));
      expect(
        (plan[MasterDataCollection.needleTypes]! as ReplaceCollection).version,
        'nv1',
      );
    });

    test('null collection with the version we sent → keep the cache', () {
      final plan = planMasterDataUpdate(
        sent: current,
        received: const MasterDataPayload(versions: current),
      );
      expect(plan.values, everyElement(isA<KeepCollection>()));
    });

    test('changed collection comes back in full and replaces only itself', () {
      final plan = planMasterDataUpdate(
        sent: current,
        received: const MasterDataPayload(
          versions: MasterDataVersions({
            MasterDataCollection.needleTypes: 'nv2',
            MasterDataCollection.exchangeTypes: 'ev1',
            MasterDataCollection.storageMappings: 'sv1',
          }),
          needleTypes: [_needle],
        ),
      );
      expect(
        (plan[MasterDataCollection.needleTypes]! as ReplaceCollection).version,
        'nv2',
      );
      expect(plan[MasterDataCollection.exchangeTypes], isA<KeepCollection>());
      expect(plan[MasterDataCollection.storageMappings], isA<KeepCollection>());
    });

    test('an empty list is a real answer: every row was deactivated', () {
      final plan = planMasterDataUpdate(
        sent: current,
        received: const MasterDataPayload(
          versions: MasterDataVersions({
            MasterDataCollection.needleTypes: 'nv3',
            MasterDataCollection.exchangeTypes: 'ev1',
            MasterDataCollection.storageMappings: 'sv1',
          }),
          needleTypes: [],
        ),
      );
      expect(plan[MasterDataCollection.needleTypes], isA<ReplaceCollection>());
    });

    test('null without a matching sent version → invalidate, refetch next '
        'time', () {
      final plan = planMasterDataUpdate(
        sent: const MasterDataVersions({
          MasterDataCollection.needleTypes: 'old',
        }),
        received: const MasterDataPayload(versions: current),
      );
      expect(
        plan[MasterDataCollection.needleTypes],
        isA<InvalidateCollectionVersion>(),
      );
      // Never sent a version at all, yet got null: also untrusted.
      expect(
        plan[MasterDataCollection.exchangeTypes],
        isA<InvalidateCollectionVersion>(),
      );
    });
  });
}
