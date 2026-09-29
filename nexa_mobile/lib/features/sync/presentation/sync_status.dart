import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/sync_state_mapper.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';

/// ONLINE / OFFLINE / SYNCING / SYNC ERROR (Doc 07 §32, Doc 17 §29).
enum SyncIndicator { online, offline, syncing, syncError }

/// Sync summary for Home's header, card and footer (Doc 07 §8, Doc 15 §19):
/// Online/Offline/Syncing, Pending: N, Failed: N, Last sync HH:mm.
final class SyncOverview {
  const SyncOverview({
    this.pending = 0,
    this.failed = 0,
    this.lastSyncAt,
    this.indicator = SyncIndicator.online,
  });

  /// Exchanges with steps/photos waiting and no failure standing.
  final int pending;

  /// Exchanges with a rejected step, or a technical failure being retried.
  final int failed;
  final DateTime? lastSyncAt;
  final SyncIndicator indicator;

  bool get allSynced => pending == 0 && failed == 0;
}

final syncOverviewProvider = Provider<SyncOverview>((ref) {
  final views = ref.watch(syncViewsProvider).value ?? const [];
  final activity = ref.watch(syncControllerProvider);
  // No reading yet counts as offline, as the header always showed it: the
  // tablet claims ONLINE only once connectivity says so.
  final offline =
      ref.watch(connectivityStatusProvider).value != ConnectivityStatus.online;
  final pending = views.where(SyncStateMapper.isPending).length;
  final failed = views.where(SyncStateMapper.isFailed).length;
  return SyncOverview(
    pending: pending,
    failed: failed,
    lastSyncAt: activity.lastSyncAt,
    indicator: offline
        ? SyncIndicator.offline
        : activity.running
        ? SyncIndicator.syncing
        : (failed > 0 || activity.lastError != null)
        ? SyncIndicator.syncError
        : SyncIndicator.online,
  );
});

/// `HH:mm`, or "belum pernah".
String syncTimeLabel(DateTime? at) {
  if (at == null) return AppStrings.syncNever;
  final local = at.toLocal();
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(local.hour)}:${two(local.minute)}';
}

/// "Pending: 2 · Gagal: 1".
String syncCountsLabel(SyncOverview sync) =>
    '${AppStrings.syncPendingLabel}: ${sync.pending} · '
    '${AppStrings.syncFailedLabel}: ${sync.failed}';

/// Label, icon and colour of a sync indicator — never colour alone.
(String, IconData, Color) syncIndicatorStyle(
  BuildContext context,
  SyncIndicator indicator,
) {
  final tokens = context.tokens;
  return switch (indicator) {
    SyncIndicator.online => (AppStrings.online, Icons.wifi, tokens.success),
    SyncIndicator.offline => (
      AppStrings.offline,
      Icons.wifi_off,
      tokens.neutral,
    ),
    SyncIndicator.syncing => (
      AppStrings.statusSyncing,
      Icons.sync,
      tokens.warning,
    ),
    SyncIndicator.syncError => (
      AppStrings.statusSyncFailed,
      Icons.sync_problem,
      tokens.danger,
    ),
  };
}

/// Home header's single status indicator (Doc 07 §32, Doc 17 §29, Doc 15
/// §19): connection and sync merged into one pill — ONLINE, OFFLINE,
/// SINKRONISASI… or SINKRON GAGAL — with "· N pending" while exchanges wait
/// to sync. The footer carries the detail (counts, last sync) and no
/// longer repeats the status word.
class SyncStatusPill extends StatelessWidget {
  const SyncStatusPill({super.key, required this.sync, this.onTap});

  final SyncOverview sync;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final (label, icon, color) = syncIndicatorStyle(context, sync.indicator);
    final badge = StatusBadge(
      key: const Key('home.status'),
      icon: icon,
      label: label,
      color: color,
      detail: sync.pending > 0
          ? '${sync.pending} ${AppStrings.statusPendingSuffix}'
          : null,
    );
    if (onTap == null) return badge;
    // Transparent Material so the ripple paints over the navy header.
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        key: const Key('home.status.tap'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(context.tokens.radius),
        child: badge,
      ),
    );
  }
}

/// Label of a local sync state (Doc 15 §8) — kept apart from server state
/// labels on purpose.
String localSyncStateLabel(LocalSyncState state) => switch (state) {
  LocalSyncState.localDraft => AppStrings.localSyncDraft,
  LocalSyncState.queued => AppStrings.localSyncQueued,
  LocalSyncState.syncing => AppStrings.localSyncSyncing,
  LocalSyncState.serverAccepted => AppStrings.localSyncAccepted,
  LocalSyncState.serverRejected => AppStrings.localSyncRejected,
  LocalSyncState.completed => AppStrings.localSyncCompleted,
};

class LocalSyncStateBadge extends StatelessWidget {
  const LocalSyncStateBadge({super.key, required this.state});

  final LocalSyncState state;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final (icon, color) = switch (state) {
      LocalSyncState.localDraft => (Icons.edit_note, tokens.neutral),
      LocalSyncState.queued => (Icons.schedule, tokens.warning),
      LocalSyncState.syncing => (Icons.sync, tokens.warning),
      LocalSyncState.serverAccepted => (Icons.cloud_done, tokens.success),
      LocalSyncState.serverRejected => (Icons.error_outline, tokens.danger),
      LocalSyncState.completed => (Icons.check_circle, tokens.success),
    };
    return StatusBadge(
      key: Key('sync.state.${state.name}'),
      icon: icon,
      label: localSyncStateLabel(state),
      color: color,
    );
  }
}

/// Home footer line (Doc 07 §8 "Sync: …", Doc 15 §19): counts and last
/// sync. The online/offline/sync word lives in the header's
/// [SyncStatusPill] only. Tapping opens the Pending Sync screen.
class SyncFooter extends ConsumerWidget {
  const SyncFooter({super.key, this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sync = ref.watch(syncOverviewProvider);
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final text = [
      '${AppStrings.syncPendingLabel}: ${sync.pending}',
      '${AppStrings.syncFailedLabel}: ${sync.failed}',
      '${AppStrings.syncLastLabel}: ${syncTimeLabel(sync.lastSyncAt)}',
    ].join('   ·   ');
    return Material(
      color: theme.colorScheme.surfaceContainer,
      child: InkWell(
        key: const Key('home.syncFooter'),
        onTap: onTap,
        child: SafeArea(
          top: false,
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: tokens.spacingLg,
              vertical: tokens.spacingSm,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.cloud_sync_outlined,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                SizedBox(width: tokens.spacingSm),
                Expanded(
                  child: Text(
                    text,
                    key: const Key('home.syncFooter.text'),
                    style: theme.textTheme.bodyLarge,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (onTap != null) const Icon(Icons.chevron_right),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
