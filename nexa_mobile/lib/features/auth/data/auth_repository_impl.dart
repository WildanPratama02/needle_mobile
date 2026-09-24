import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/storage/session_token_store.dart';
import 'package:nexa_mobile/features/auth/data/auth_remote_data_source.dart';
import 'package:nexa_mobile/features/auth/data/user_session_local_data_source.dart';
import 'package:nexa_mobile/features/auth/domain/auth_repository.dart';
import 'package:nexa_mobile/features/auth/domain/auth_user.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required this._remote,
    required this._local,
    required this._tokenStore,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final AuthRemoteDataSource _remote;
  final UserSessionLocalDataSource _local;
  final SessionTokenStore _tokenStore;
  final DateTime Function() _now;

  @override
  Future<LoginResult> login({
    required String username,
    required String password,
  }) async {
    final result = await _remote.login(username, password);
    switch (result) {
      case ApiFailure(:final error):
        return LoginFailed(error);
      case ApiSuccess(:final data):
        await _tokenStore.save(
          SessionTokens(
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            accessTokenExpiresAt: _now().add(
              Duration(seconds: data.expiresInSeconds),
            ),
          ),
        );
        final user = AuthUser(
          id: data.userId,
          username: data.username,
          name: data.name,
          roles: data.roles,
        );
        await _local.write(user);
        AppLogger.info('auth', 'login succeeded');
        return LoginSucceeded(user);
    }
  }

  @override
  Future<AuthUser?> restoreSession() async {
    final tokens = await _tokenStore.read();
    if (tokens == null) return null;
    final user = await _local.read();
    if (user == null) {
      // Tokens without a user should not happen; start clean.
      await _tokenStore.clear();
      return null;
    }
    return user;
  }

  @override
  Future<AuthUser?> refreshProfile() async {
    final result = await _remote.me();
    switch (result) {
      case ApiFailure(:final error):
        AppLogger.warning('auth', 'GET /auth/me failed: ${error.code}');
        return null;
      case ApiSuccess(:final data):
        final current = await _local.read();
        final base =
            current ??
            AuthUser(
              id: data.id,
              username: data.username,
              name: data.name,
              roles: data.roles,
            );
        final user = base.withProfile(
          roles: data.roles,
          permissions: data.permissions,
          factoryIds: data.factoryIds,
          locationIds: data.locationIds,
        );
        await _local.write(user);
        return user;
    }
  }

  @override
  Future<void> logout() async {
    final tokens = await _tokenStore.read();
    if (tokens != null) {
      final result = await _remote.logout(tokens.refreshToken);
      if (result case ApiFailure(:final error)) {
        // Offline or already revoked: the refresh token expires on its own
        // (7 days). Local sign-out must not depend on the network.
        AppLogger.warning('auth', 'logout call failed: ${error.code}');
      }
    }
    await _tokenStore.clear();
    await _local.clear();
  }
}
