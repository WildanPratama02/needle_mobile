import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

/// Local master-data cache. Phase 3 fills it from bootstrap; Phase 5 adds the
/// refresh triggered by `changes.masterDataVersions` on sync.
abstract interface class MasterDataRepository {
  Future<MasterDataVersions> storedVersions();

  /// Applies [planMasterDataUpdate] for one bootstrap answer, atomically.
  Future<void> apply({
    required MasterDataVersions sent,
    required MasterDataPayload received,
  });

  Future<List<NeedleType>> needleTypes();
  Future<List<ExchangeType>> exchangeTypes();
  Future<List<StorageMapping>> storageMappings();

  /// Drops every row and version (re-provisioning: the new device may belong
  /// to another trolley or factory).
  Future<void> clear();
}
