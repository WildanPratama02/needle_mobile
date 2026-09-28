import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_controller.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/exchange_dialogs.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';
import 'package:nexa_mobile/shared/widgets/screen_title_bar.dart';

/// Pending Sync (Doc 17 §28, §30; Doc 07 §37): every exchange whose steps or
/// photos are still on the tablet, with its local sync state; a rejected one
/// shows the server's reason and can be opened, resent or cancelled. A
/// business rejection is told apart from a network failure (Doc 17 §30) and
/// is never overwritten silently (Doc 15 §13). One primary action:
/// "SINKRONKAN SEKARANG".
class SyncQueueScreen extends ConsumerWidget {
  const SyncQueueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final views = ref.watch(syncViewsProvider).value ?? const [];
    final activity = ref.watch(syncControllerProvider);
    final sync = ref.watch(syncOverviewProvider);
    final connectivity = ref.watch(connectivityStatusProvider).value;
    final offline = connectivity == ConnectivityStatus.offline;
    final items = [
      for (final v in views)
        if (v.unresolved) v,
    ]..sort((a, b) => a.createdAt.compareTo(b.createdAt));

    return Scaffold(
      backgroundColor: tokens.pageBackground,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ScreenTitleBar(
            title: AppStrings.syncScreenTitle,
            connectivity: connectivity,
            backKey: const Key('sync.back'),
          ),
          Padding(
            padding: EdgeInsets.all(tokens.spacingLg),
            child: Text(
              items.isEmpty
                  ? AppStrings.syncScreenEmpty
                  : '${items.length} ${AppStrings.syncWaitingSuffix}   ·   '
                        '${syncCountsLabel(sync)}   ·   '
                        '${AppStrings.syncLastLabel}: '
                        '${syncTimeLabel(sync.lastSyncAt)}',
              key: const Key('sync.summary'),
              style: theme.textTheme.titleMedium,
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.symmetric(horizontal: tokens.spacingLg),
              itemCount: items.length,
              separatorBuilder: (_, _) => SizedBox(height: tokens.spacingMd),
              itemBuilder: (context, i) => _SyncItemCard(
                view: items[i],
                syncing: activity.running,
                offline: offline,
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(tokens.spacingLg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (offline)
                  Padding(
                    padding: EdgeInsets.only(bottom: tokens.spacingSm),
                    child: Text(
                      AppStrings.syncNeedsOnline,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge,
                    ),
                  ),
                PrimaryActionButton(
                  key: const Key('sync.now'),
                  label: AppStrings.syncNow,
                  icon: Icons.sync,
                  busy: activity.running,
                  onPressed: offline
                      ? null
                      : () => unawaited(
                          ref
                              .read(syncControllerProvider.notifier)
                              .syncNow(manual: true),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SyncItemCard extends ConsumerWidget {
  const _SyncItemCard({
    required this.view,
    required this.syncing,
    required this.offline,
  });

  final ExchangeSyncView view;
  final bool syncing;
  final bool offline;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final ctx = view.clientTransactionId;
    final state = SyncStateMapper.forExchange(view, syncing: syncing);
    final rejected = view.rejected;
    final failing = view.failing;
    final controller = ref.read(syncControllerProvider.notifier);

    Future<void> open() async {
      ref.read(exchangeOpenRequestProvider.notifier).open(ctx);
      await context.push(Routes.newExchange);
    }

    Future<void> cancel() async {
      final reason = await showCancelExchangeDialog(
        context,
        stockIssued: view.serverState?.stockIssued ?? false,
      );
      if (reason == null || reason.trim().isEmpty) return;
      await controller.cancelExchange(ctx, reason.trim());
    }

    final lines = <String>[
      if (view.operatorName != null) view.operatorName!,
      if (view.photosAwaitingUpload > 0)
        '${view.photosAwaitingUpload} ${AppStrings.syncPhotosWaiting}',
      if (failing != null)
        '${AppStrings.syncTechnicalFailure}'
            '${failing.nextAttemptAt == null ? '' : ' — ${AppStrings.syncNextAttempt} ${syncTimeLabel(failing.nextAttemptAt)}'}',
    ];

    return AppCard(
      key: Key('sync.item.$ctx'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  view.exchangeNumber ?? AppStrings.syncNoNumber,
                  style: theme.textTheme.titleLarge,
                ),
              ),
              LocalSyncStateBadge(state: state),
            ],
          ),
          for (final line in lines)
            Padding(
              padding: EdgeInsets.only(top: tokens.spacingXs),
              child: Text(line, style: theme.textTheme.bodyLarge),
            ),
          if (rejected != null) ...[
            SizedBox(height: tokens.spacingSm),
            Text(
              const ErrorMapper()
                  .fromCommandError(
                    code: rejected.lastError?.code ?? '',
                    context: rejected.lastError?.context ?? const {},
                  )
                  .userMessage,
              key: Key('sync.reason.$ctx'),
              style: theme.textTheme.titleMedium?.copyWith(
                color: tokens.danger,
              ),
            ),
            Text(AppStrings.syncRejectedHint, style: theme.textTheme.bodySmall),
            SizedBox(height: tokens.spacingSm),
            Row(
              children: [
                Expanded(
                  child: SecondaryActionButton(
                    key: Key('sync.open.$ctx'),
                    label: AppStrings.syncOpenExchange,
                    icon: Icons.open_in_new,
                    onPressed: () => unawaited(open()),
                  ),
                ),
                SizedBox(width: tokens.spacingMd),
                Expanded(
                  child: SecondaryActionButton(
                    key: Key('sync.retry.$ctx'),
                    label: AppStrings.syncRetryItem,
                    icon: Icons.refresh,
                    onPressed: offline
                        ? null
                        : () => unawaited(
                            controller.retryRejected(rejected.commandId),
                          ),
                  ),
                ),
                SizedBox(width: tokens.spacingMd),
                Expanded(
                  child: SecondaryActionButton(
                    key: Key('sync.cancel.$ctx'),
                    label: AppStrings.syncCancelExchange,
                    icon: Icons.cancel_outlined,
                    onPressed: () => unawaited(cancel()),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
