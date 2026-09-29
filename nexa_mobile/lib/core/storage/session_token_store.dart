import 'package:nexa_mobile/core/storage/secure_store.dart';

/// The token pair issued by `POST /auth/login` and rotated by
/// `POST /auth/refresh`. The refresh token is single-use (contract matrix,
/// "Auth" convention): once it has been sent, it must be replaced by the answer
/// or discarded — never sent again.
final class SessionTokens {
  const SessionTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.accessTokenExpiresAt,
  });

  final String accessToken;
  final String refreshToken;
  final DateTime accessTokenExpiresAt;
}

/// Reads and writes [SessionTokens] in [SecureStore], with an in-memory copy so
/// every request does not hit the Keystore.
class SessionTokenStore {
  SessionTokenStore(this._store);

  final SecureStore _store;
  SessionTokens? _cached;
  bool _loaded = false;

  Future<SessionTokens?> read() async {
    if (_loaded) return _cached;
    final access = await _store.read(SecureStoreKeys.accessToken);
    final refresh = await _store.read(SecureStoreKeys.refreshToken);
    final expiresAt = DateTime.tryParse(
      await _store.read(SecureStoreKeys.accessTokenExpiresAt) ?? '',
    );
    _cached = (access != null && refresh != null)
        ? SessionTokens(
            accessToken: access,
            refreshToken: refresh,
            accessTokenExpiresAt:
                expiresAt ?? DateTime.fromMillisecondsSinceEpoch(0),
          )
        : null;
    _loaded = true;
    return _cached;
  }

  Future<void> save(SessionTokens tokens) async {
    _cached = tokens;
    _loaded = true;
    await _store.write(SecureStoreKeys.accessToken, tokens.accessToken);
    await _store.write(SecureStoreKeys.refreshToken, tokens.refreshToken);
    await _store.write(
      SecureStoreKeys.accessTokenExpiresAt,
      tokens.accessTokenExpiresAt.toUtc().toIso8601String(),
    );
  }

  Future<void> clear() async {
    _cached = null;
    _loaded = true;
    await _store.delete(SecureStoreKeys.accessToken);
    await _store.delete(SecureStoreKeys.refreshToken);
    await _store.delete(SecureStoreKeys.accessTokenExpiresAt);
  }
}
