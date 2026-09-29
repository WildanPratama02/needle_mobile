import 'package:nexa_mobile/core/storage/secure_store.dart';

/// The device identity learned at provisioning (contract matrix MG-1).
///
/// Lives in `core/` because the HTTP layer needs the id for `X-Device-ID` on
/// every request; the provisioning rules themselves live in
/// `features/device_context/`.
final class StoredDeviceIdentity {
  const StoredDeviceIdentity({required this.deviceId, this.deviceCode});

  final String deviceId;

  /// Shown to the operator for confirmation only; never used for authorization.
  final String? deviceCode;
}

class ProvisionedDeviceStore {
  ProvisionedDeviceStore(this._store);

  final SecureStore _store;
  StoredDeviceIdentity? _cached;
  bool _loaded = false;

  Future<StoredDeviceIdentity?> read() async {
    if (_loaded) return _cached;
    final id = await _store.read(SecureStoreKeys.deviceId);
    final code = await _store.read(SecureStoreKeys.deviceCode);
    _cached = id == null
        ? null
        : StoredDeviceIdentity(deviceId: id, deviceCode: code);
    _loaded = true;
    return _cached;
  }

  Future<String?> readDeviceId() async => (await read())?.deviceId;

  Future<void> save(StoredDeviceIdentity identity) async {
    _cached = identity;
    _loaded = true;
    await _store.write(SecureStoreKeys.deviceId, identity.deviceId);
    final code = identity.deviceCode;
    if (code == null) {
      await _store.delete(SecureStoreKeys.deviceCode);
    } else {
      await _store.write(SecureStoreKeys.deviceCode, code);
    }
  }

  Future<void> clear() async {
    _cached = null;
    _loaded = true;
    await _store.delete(SecureStoreKeys.deviceId);
    await _store.delete(SecureStoreKeys.deviceCode);
  }
}
