import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/login_controller.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/inline_error.dart';

/// FR-MOB-001, username + password for v1 (MG-2). One primary action: MASUK.
/// Device validation follows automatically (MG-14).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _username = TextEditingController();
  final _password = TextEditingController();
  final _passwordFocus = FocusNode();

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _submit() {
    FocusScope.of(context).unfocus();
    ref
        .read(loginControllerProvider.notifier)
        .submit(username: _username.text, password: _password.text);
  }

  @override
  Widget build(BuildContext context) {
    final form = ref.watch(loginControllerProvider);
    final session = ref.watch(sessionControllerProvider);
    final provisioning = ref.watch(provisioningControllerProvider);
    final tokens = context.tokens;
    final theme = Theme.of(context);

    final notice =
        session is SignedOut && session.reason == SignOutReason.sessionExpired
        ? AppStrings.sessionExpired
        : null;
    final message = form.errorMessage ?? notice;
    final deviceCode = provisioning is Provisioned
        ? (provisioning.device.deviceCode ?? provisioning.device.deviceId)
        : null;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(tokens.spacingLg),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: tokens.maxContentWidth),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      AppStrings.appName,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                    SizedBox(height: tokens.spacingSm),
                    Text(
                      AppStrings.loginTitle,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleLarge,
                    ),
                    if (deviceCode != null) ...[
                      SizedBox(height: tokens.spacingSm),
                      Text(
                        '${AppStrings.loginDevice}: $deviceCode',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                    SizedBox(height: tokens.spacingLg),
                    TextField(
                      key: const Key('login.username'),
                      controller: _username,
                      enabled: !form.submitting,
                      autofillHints: const [AutofillHints.username],
                      textInputAction: TextInputAction.next,
                      style: theme.textTheme.bodyLarge,
                      decoration: const InputDecoration(
                        labelText: AppStrings.username,
                        prefixIcon: Icon(Icons.person),
                      ),
                      onSubmitted: (_) => _passwordFocus.requestFocus(),
                    ),
                    SizedBox(height: tokens.spacingMd),
                    TextField(
                      key: const Key('login.password'),
                      controller: _password,
                      focusNode: _passwordFocus,
                      enabled: !form.submitting,
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      textInputAction: TextInputAction.done,
                      style: theme.textTheme.bodyLarge,
                      decoration: const InputDecoration(
                        labelText: AppStrings.password,
                        prefixIcon: Icon(Icons.lock),
                      ),
                      onSubmitted: (_) => _submit(),
                    ),
                    if (message != null) ...[
                      SizedBox(height: tokens.spacingMd),
                      InlineError(message: message),
                    ],
                    SizedBox(height: tokens.spacingLg),
                    PrimaryActionButton(
                      key: const Key('login.submit'),
                      label: AppStrings.loginAction,
                      icon: Icons.login,
                      busy: form.submitting,
                      onPressed: _submit,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
