import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/auth/data/auth_providers.dart';
import 'package:nexa_mobile/features/auth/domain/auth_repository.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';

/// The session for the whole app: restored at start-up, set by login, ended by
/// logout or by a rejected refresh token.
class SessionController extends Notifier<SessionState> {
  AuthRepository get _repository => ref.read(authRepositoryProvider);

  @override
  SessionState build() {
    final subscription = ref.watch(sessionEventsProvider).stream.listen((_) {
      if (state is SignedIn) {
        state = const SignedOut(SignOutReason.sessionExpired);
        // Tokens are already gone; drop the cached user as well.
        unawaited(_repository.logout());
      }
    });
    ref.onDispose(subscription.cancel);
    unawaited(_restore());
    return const SessionRestoring();
  }

  Future<void> _restore() async {
    final user = await _repository.restoreSession();
    if (!ref.mounted) return;
    if (user == null) {
      state = const SignedOut();
      return;
    }
    state = SignedIn(user);
    unawaited(_refreshProfile());
  }

  /// FR-MOB-001. Device validation runs next (MG-14), driven by
  /// `DeviceValidationController` reacting to [SignedIn].
  Future<LoginResult> login({
    required String username,
    required String password,
  }) async {
    final result = await _repository.login(
      username: username,
      password: password,
    );
    if (!ref.mounted) return result;
    if (result is LoginSucceeded) {
      state = SignedIn(result.user);
      unawaited(_refreshProfile());
    }
    return result;
  }

  /// Loads roles, permissions and scopes (`GET /auth/me`) in the background;
  /// the cached user stays in place when it fails.
  Future<void> _refreshProfile() async {
    final user = await _repository.refreshProfile();
    if (!ref.mounted || user == null) return;
    final current = state;
    if (current is SignedIn && current.user.id == user.id) {
      state = SignedIn(user);
    }
  }

  Future<void> logout({SignOutReason reason = SignOutReason.userLogout}) async {
    await _repository.logout();
    if (!ref.mounted) return;
    state = SignedOut(reason);
  }
}

final sessionControllerProvider =
    NotifierProvider<SessionController, SessionState>(SessionController.new);
