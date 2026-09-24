import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/features/auth/domain/auth_repository.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';

final class LoginFormState {
  const LoginFormState({this.submitting = false, this.errorMessage});

  final bool submitting;

  /// Safe, Indonesian, never a stack trace (Doc 07 §40).
  final String? errorMessage;
}

class LoginController extends Notifier<LoginFormState> {
  @override
  LoginFormState build() => const LoginFormState();

  Future<void> submit({
    required String username,
    required String password,
  }) async {
    if (state.submitting) return;
    if (username.trim().isEmpty || password.isEmpty) {
      state = const LoginFormState(
        errorMessage: AppStrings.loginFieldsRequired,
      );
      return;
    }
    state = const LoginFormState(submitting: true);
    final result = await ref
        .read(sessionControllerProvider.notifier)
        .login(username: username.trim(), password: password);
    if (!ref.mounted) return;
    state = switch (result) {
      LoginSucceeded() => const LoginFormState(),
      LoginFailed(:final error) => LoginFormState(
        errorMessage: _messageFor(error),
      ),
    };
  }

  /// The backend answers 401 for a wrong password and for an inactive user
  /// alike; say so without telling them apart (and never "session expired").
  static String _messageFor(AppError error) =>
      error.category == ErrorCategory.authentication
      ? AppStrings.loginInvalidCredentials
      : error.userMessage;
}

final loginControllerProvider =
    NotifierProvider.autoDispose<LoginController, LoginFormState>(
      LoginController.new,
    );
