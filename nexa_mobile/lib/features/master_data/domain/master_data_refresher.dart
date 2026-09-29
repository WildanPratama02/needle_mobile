import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

sealed class MasterDataRefreshOutcome {
  const MasterDataRefreshOutcome();
}

/// The cache holds the backend's current versions (collections that changed
/// were replaced, unchanged ones kept).
final class MasterDataRefreshed extends MasterDataRefreshOutcome {
  const MasterDataRefreshed();
}

/// Nothing to do: the reported versions equal the stored ones.
final class MasterDataAlreadyCurrent extends MasterDataRefreshOutcome {
  const MasterDataAlreadyCurrent();
}

/// Could not refresh (offline, 5xx, device blocked…): keep using the cache.
final class MasterDataRefreshFailed extends MasterDataRefreshOutcome {
  const MasterDataRefreshFailed(this.error);

  final AppError? error;
}

/// Refreshes the needle-type / exchange-type / storage-mapping cache
/// (Doc 15 §16–17, contract matrix `master_data` rows: "compare, then
/// re-bootstrap"). The versions held are sent with the request, so an
/// unchanged collection comes back as `null` and is kept.
abstract interface class MasterDataRefresher {
  /// With [reported] (versions from a sync answer), refreshes only when they
  /// differ from the cache; without, always asks the backend.
  Future<MasterDataRefreshOutcome> refresh({MasterDataVersions? reported});
}
