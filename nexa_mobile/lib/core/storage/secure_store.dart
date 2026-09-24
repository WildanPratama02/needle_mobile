import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Key/value storage backed by the Android Keystore.
///
/// Holds exactly what `nexa_mobile/CLAUDE.md` §2 (encryption v1) puts here:
/// the token pair and the provisioned device id. Nothing else — cached context
/// lives in the (unencrypted) Drift database because it holds no credentials.
abstract interface class SecureStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

abstract final class SecureStoreKeys {
  static const accessToken = 'auth.accessToken';
  static const refreshToken = 'auth.refreshToken';
  static const accessTokenExpiresAt = 'auth.accessTokenExpiresAt';
  static const deviceId = 'device.id';
  static const deviceCode = 'device.code';
}

class FlutterSecureStore implements SecureStore {
  FlutterSecureStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}
