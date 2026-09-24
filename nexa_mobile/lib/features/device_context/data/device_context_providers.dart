import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/device_context/data/bootstrap_repository_impl.dart';
import 'package:nexa_mobile/features/device_context/data/device_context_local_data_source.dart';
import 'package:nexa_mobile/features/device_context/data/device_remote_data_source.dart';
import 'package:nexa_mobile/features/device_context/data/heartbeat_repository_impl.dart';
import 'package:nexa_mobile/features/device_context/data/provisioning_repository_impl.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';

final _deviceRemoteProvider = Provider<DeviceRemoteDataSource>(
  (ref) => DeviceRemoteDataSource(ref.watch(apiClientProvider)),
);

final _deviceLocalProvider = Provider<DeviceContextLocalDataSource>(
  (ref) => DeviceContextLocalDataSource(ref.watch(appDatabaseProvider)),
);

final provisioningRepositoryProvider = Provider<ProvisioningRepository>(
  (ref) => ProvisioningRepositoryImpl(
    store: ref.watch(provisionedDeviceStoreProvider),
    contextCache: ref.watch(_deviceLocalProvider),
    masterData: ref.watch(masterDataRepositoryProvider),
  ),
);

final bootstrapRepositoryProvider = Provider<BootstrapRepository>(
  (ref) => BootstrapRepositoryImpl(
    remote: ref.watch(_deviceRemoteProvider),
    local: ref.watch(_deviceLocalProvider),
    masterData: ref.watch(masterDataRepositoryProvider),
    deviceStore: ref.watch(provisionedDeviceStoreProvider),
  ),
);

final heartbeatRepositoryProvider = Provider<HeartbeatRepository>(
  (ref) => HeartbeatRepositoryImpl(ref.watch(_deviceRemoteProvider)),
);
