import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_refresher.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

/// [MasterDataRefresher] through `GET /mobile/bootstrap?…Version=` — the one
/// endpoint that serves master data to the tablet. Lives here because
/// bootstrap belongs to device context; the master-data feature only sees the
/// interface.
class BootstrapMasterDataRefresher implements MasterDataRefresher {
  const BootstrapMasterDataRefresher(this._bootstrap, this._masterData);

  final BootstrapRepository _bootstrap;
  final MasterDataRepository _masterData;

  @override
  Future<MasterDataRefreshOutcome> refresh({
    MasterDataVersions? reported,
  }) async {
    if (reported != null) {
      final held = await _masterData.storedVersions();
      if (!held.differsFrom(reported)) return const MasterDataAlreadyCurrent();
    }
    return switch (await _bootstrap.bootstrap()) {
      BootstrapSucceeded() => const MasterDataRefreshed(),
      BootstrapUnavailable(:final error) => MasterDataRefreshFailed(error),
      BootstrapAccessDenied(:final error) => MasterDataRefreshFailed(error),
      BootstrapDeviceBlocked() ||
      BootstrapDeviceNotRegistered() => const MasterDataRefreshFailed(null),
    };
  }
}
