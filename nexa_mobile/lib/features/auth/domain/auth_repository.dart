import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/auth/domain/auth_user.dart';

sealed class LoginResult {
  const LoginResult();
}

final class LoginSucceeded extends LoginResult {
  const LoginSucceeded(this.user);

  final AuthUser user;
}

final class LoginFailed extends LoginResult {
  const LoginFailed(this.error);

  final AppError error;
}

/// Session operations (FR-MOB-001). Username + password for v1 (MG-2).
abstract interface class AuthRepository {
  /// `POST /auth/login`; stores the token pair and the user on success.
  Future<LoginResult> login({
    required String username,
    required String password,
  });

  /// The stored session, if tokens and a cached user both exist. Works offline.
  Future<AuthUser?> restoreSession();

  /// `GET /auth/me`; updates the cached user. Returns `null` on failure and
  /// leaves the cache untouched.
  Future<AuthUser?> refreshProfile();

  /// `POST /auth/logout` (best effort) and always clears tokens and the cached
  /// user, online or not.
  Future<void> logout();
}
