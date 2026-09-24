import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/app_header.dart';

/// Home (Doc 07 §8, Doc 17 §7): factory / trolley / connection in the header,
/// NEW EXCHANGE as the dominant action, then trolley stock and history, and
/// the sync status in the footer. The three actions lead to placeholders in
/// this build.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final validation = ref.watch(deviceValidationControllerProvider);
    // The router only shows Home for a passed validation.
    if (validation is! ValidationPassed) return const SizedBox.shrink();
    final context_ = validation.context;
    final session = ref.watch(sessionControllerProvider);
    final picName = session is SignedIn ? session.user.name : '-';
    final connectivity = ref.watch(connectivityStatusProvider).value;
    final sync = ref.watch(syncOverviewProvider);
    final tokens = context.tokens;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppHeader(
        factoryName: context_.factory.name,
        trolleyName: '${context_.trolley.code} · ${context_.trolley.name}',
        picName: picName,
        connectivity: connectivity,
        actions: [
          SizedBox(width: tokens.spacingSm),
          IconButton(
            key: const Key('home.settings'),
            tooltip: AppStrings.settings,
            icon: const Icon(Icons.settings),
            onPressed: () => context.push(Routes.settings),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(tokens.spacingLg),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: tokens.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    AppStrings.homeTitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: tokens.spacingLg),
                  PrimaryActionButton(
                    key: const Key('home.newExchange'),
                    label: AppStrings.newExchange,
                    dominant: true,
                    onPressed: () => context.push(Routes.newExchange),
                  ),
                  SizedBox(height: tokens.spacingLg),
                  Row(
                    children: [
                      Expanded(
                        child: SecondaryActionButton(
                          key: const Key('home.trolleyStock'),
                          label: AppStrings.trolleyStock,
                          icon: Icons.inventory_2,
                          onPressed: () => context.push(Routes.trolleyStock),
                        ),
                      ),
                      SizedBox(width: tokens.spacingLg),
                      Expanded(
                        child: SecondaryActionButton(
                          key: const Key('home.history'),
                          label: AppStrings.history,
                          icon: Icons.history,
                          onPressed: () => context.push(Routes.history),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: _Footer(
        syncText: sync.allSynced ? AppStrings.syncAllDone : null,
        cachedSince: validation.fromCache ? context_.fetchedAt : null,
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.syncText, required this.cachedSince});

  final String? syncText;
  final DateTime? cachedSince;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final since = cachedSince;
    return Material(
      color: theme.colorScheme.surfaceContainer,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacingLg,
            vertical: tokens.spacingMd,
          ),
          child: Row(
            children: [
              Icon(Icons.sync, size: tokens.iconSize),
              SizedBox(width: tokens.spacingSm),
              Expanded(
                child: Text(syncText ?? '', style: theme.textTheme.bodyLarge),
              ),
              if (since != null) ...[
                Icon(
                  Icons.history_toggle_off,
                  size: tokens.iconSize,
                  color: tokens.warning,
                ),
                SizedBox(width: tokens.spacingSm),
                Text(
                  '${AppStrings.cachedContextSince} ${_hhmm(since)}',
                  key: const Key('home.cachedNotice'),
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: tokens.warning,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static String _hhmm(DateTime t) {
    final local = t.toLocal();
    String two(int v) => v.toString().padLeft(2, '0');
    return '${two(local.hour)}:${two(local.minute)}';
  }
}
