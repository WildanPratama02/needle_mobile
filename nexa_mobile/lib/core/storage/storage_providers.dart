import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/storage/provisioned_device_store.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/core/storage/session_token_store.dart';

/// Overridden in tests with an in-memory store.
final secureStoreProvider = Provider<SecureStore>(
  (ref) => FlutterSecureStore(),
);

final sessionTokenStoreProvider = Provider<SessionTokenStore>(
  (ref) => SessionTokenStore(ref.watch(secureStoreProvider)),
);

final provisionedDeviceStoreProvider = Provider<ProvisionedDeviceStore>(
  (ref) => ProvisionedDeviceStore(ref.watch(secureStoreProvider)),
);
