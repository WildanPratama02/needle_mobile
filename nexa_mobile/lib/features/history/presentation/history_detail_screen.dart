import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/error/error_mapper.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_controller.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_state_label.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_entry.dart';
import 'package:nexa_mobile/features/history/presentation/history_detail_controller.dart';
import 'package:nexa_mobile/features/history/presentation/widgets/history_labels.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/sync/data/sync_providers.dart';
import 'package:nexa_mobile/features/sync/domain/exchange_sync_view.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_controller.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/format/date_time_format.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';
import 'package:nexa_mobile/shared/widgets/message_panel.dart';
import 'package:nexa_mobile/shared/widgets/screen_title_bar.dart';

/// Read-only detail of one history row (FR-MOB-014): every field, the
/// confirmation status, the evidence photos (online only, presigned URLs),
/// and the local sync state. For an unfinished exchange of this tablet the
/// one action is resuming it in the exchange wizard.
class HistoryDetailScreen extends ConsumerWidget {
  const HistoryDetailScreen({super.key, required this.entry});

  /// The row tapped in the list; `null` when the route was restored without
  /// it (nothing to show — back to the list).
  final HistoryEntry? entry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final connectivity = ref.watch(connectivityStatusProvider).value;
    final validation = ref.watch(deviceValidationControllerProvider);
    final initial = entry;
    if (initial == null || validation is! ValidationPassed) {
      return Scaffold(
        backgroundColor: tokens.pageBackground,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ScreenTitleBar(
              title: AppStrings.historyDetailTitle,
              connectivity: connectivity,
              backKey: const Key('historyDetail.back'),
            ),
            Expanded(
              child: MessagePanel(
                icon: Icons.info_outline,
                iconColor: tokens.neutral,
                title: AppStrings.historyDetailTitle,
                body: AppStrings.historyDetailMissing,
                primaryLabel: AppStrings.back,
                onPrimary: () => context.pop(),
              ),
            ),
          ],
        ),
      );
    }

    final detail = ref.watch(historyDetailControllerProvider(initial));
    final catalog =
        ref.watch(historyCatalogProvider).value ?? const HistoryCatalog();
    final views = ref.watch(syncViewsProvider).value ?? const [];
    final syncing = ref.watch(syncControllerProvider.select((s) => s.running));
    final live = _liveLocal(views, initial) ?? initial.local;
    // The freshest server answer wins; the local sync state is layered on
    // top — exactly as in the list (HistoryEntry.of).
    final view = HistoryEntry.of(
      serverRow: detail.fresh ?? initial.server,
      local: live,
      syncing: syncing,
    );
    final deviceId = validation.context.device.id;
    final resumable = view.canResume(deviceId);

    Future<void> resume() async {
      ref
          .read(exchangeOpenRequestProvider.notifier)
          .open(view.clientTransactionId!);
      await context.push(Routes.newExchange);
    }

    return Scaffold(
      backgroundColor: tokens.pageBackground,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ScreenTitleBar(
            title: AppStrings.historyDetailTitle,
            subtitle: view.exchangeNumber ?? AppStrings.syncNoNumber,
            connectivity: connectivity,
            backKey: const Key('historyDetail.back'),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(tokens.spacingLg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (detail.refreshError != null)
                    Padding(
                      padding: EdgeInsets.only(bottom: tokens.spacingMd),
                      child: Text(
                        AppStrings.historyDetailRefreshFailed,
                        key: const Key('historyDetail.refreshFailed'),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: tokens.warning),
                      ),
                    ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 3,
                        child: _Fields(
                          entry: view,
                          catalog: catalog,
                          confirmation: detail.confirmation,
                        ),
                      ),
                      SizedBox(width: tokens.spacingLg),
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _SyncCard(entry: view),
                            SizedBox(height: tokens.spacingLg),
                            _EvidenceCard(
                              evidence: detail.evidence,
                              photosOnTablet:
                                  view.local?.photosAwaitingUpload ?? 0,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (resumable)
            Padding(
              padding: EdgeInsets.all(tokens.spacingLg),
              child: PrimaryActionButton(
                key: const Key('historyDetail.resume'),
                label: AppStrings.historyResume,
                icon: Icons.play_arrow,
                onPressed: () => unawaited(resume()),
              ),
            ),
        ],
      ),
    );
  }

  /// The tablet's current record of the exchange (live), matched on its key
  /// or its server id.
  static ExchangeSyncView? _liveLocal(
    List<ExchangeSyncView> views,
    HistoryEntry entry,
  ) {
    final ctx = entry.clientTransactionId;
    final serverId = entry.serverExchangeId;
    for (final v in views) {
      if (ctx != null && v.clientTransactionId == ctx) return v;
      if (serverId != null && v.serverExchangeId == serverId) return v;
    }
    return null;
  }
}

class _Fields extends StatelessWidget {
  const _Fields({
    required this.entry,
    required this.catalog,
    required this.confirmation,
  });

  final HistoryEntry entry;
  final HistoryCatalog catalog;
  final ConfirmationStatus? confirmation;

  String get _fragment => switch (entry.fragmentStatus) {
    FragmentStatus.found => AppStrings.historyDetailFragmentFound,
    FragmentStatus.notFound => AppStrings.historyDetailFragmentNotFound,
    null => AppStrings.historyNoValue,
  };

  String get _confirmation {
    final status = confirmation ?? entry.confirmationStatus;
    if (status != null) {
      return switch (status) {
        ConfirmationStatus.pending => AppStrings.confirmationStatusPending,
        ConfirmationStatus.approved => AppStrings.confirmationStatusApproved,
        ConfirmationStatus.rejected => AppStrings.confirmationStatusRejected,
        ConfirmationStatus.expired => AppStrings.confirmationStatusExpired,
      };
    }
    return entry.confirmationId == null
        ? AppStrings.historyDetailConfirmationNone
        : AppStrings.historyDetailConfirmationUnknown;
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final operator = operatorLabel(entry);
    final oldNeedle = needleLabel(catalog, entry.oldNeedleTypeId);
    final newNeedle = needleLabel(catalog, entry.newNeedleTypeId);
    String joined(({String title, String? subtitle}) v) =>
        v.subtitle == null ? v.title : '${v.title} · ${v.subtitle}';
    final completedAt = entry.completedAt;
    final cancelledAt = entry.cancelledAt;
    return AppCard(
      key: const Key('historyDetail.fields'),
      padding: EdgeInsets.all(tokens.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _Field(
            AppStrings.summaryExchangeNumber,
            entry.exchangeNumber ?? AppStrings.syncNoNumber,
          ),
          _Field(
            AppStrings.historyDetailCreatedAt,
            formatDateTime(entry.createdAt),
          ),
          _Field(
            AppStrings.historyColumnOperator,
            joined(operator),
            valueKey: const Key('historyDetail.operator'),
          ),
          _Field(
            AppStrings.historyColumnExchangeType,
            exchangeTypeLabel(catalog, entry),
          ),
          _Field(AppStrings.historyColumnOldNeedle, joined(oldNeedle)),
          _Field(AppStrings.historyDetailFragment, _fragment),
          _Field(
            AppStrings.historyDetailConfirmation,
            _confirmation,
            valueKey: const Key('historyDetail.confirmation'),
          ),
          _Field(AppStrings.historyColumnNewNeedle, joined(newNeedle)),
          _FieldRow(
            label: AppStrings.historyColumnStatus,
            child: ExchangeStateText(
              key: const Key('historyDetail.status'),
              state: entry.state,
            ),
          ),
          if (completedAt != null)
            _Field(
              AppStrings.historyDetailCompletedAt,
              formatDateTime(completedAt),
            ),
          if (cancelledAt != null)
            _Field(
              AppStrings.historyDetailCancelledAt,
              formatDateTime(cancelledAt),
            ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field(this.label, this.value, {this.valueKey});

  final String label;
  final String value;
  final Key? valueKey;

  @override
  Widget build(BuildContext context) => _FieldRow(
    label: label,
    child: Text(
      value,
      key: valueKey,
      style: Theme.of(context).textTheme.titleMedium,
    ),
  );
}

class _FieldRow extends StatelessWidget {
  const _FieldRow({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Padding(
      padding: EdgeInsets.symmetric(vertical: tokens.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 200,
            child: Text(label, style: Theme.of(context).textTheme.labelLarge),
          ),
          Expanded(
            child: Align(alignment: Alignment.centerLeft, child: child),
          ),
        ],
      ),
    );
  }
}

class _SyncCard extends StatelessWidget {
  const _SyncCard({required this.entry});

  final HistoryEntry entry;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final rejected = entry.local?.rejected;
    return AppCard(
      key: const Key('historyDetail.sync'),
      padding: EdgeInsets.all(tokens.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(AppStrings.historyColumnSync, style: theme.textTheme.labelLarge),
          SizedBox(height: tokens.spacingSm),
          LocalSyncStateBadge(state: entry.syncState),
          if (entry.pendingSteps > 0) ...[
            SizedBox(height: tokens.spacingSm),
            Text(
              '${entry.pendingSteps} ${AppStrings.historyDetailPendingSteps}',
              key: const Key('historyDetail.pendingSteps'),
              style: theme.textTheme.bodyLarge,
            ),
          ],
          if (rejected != null) ...[
            SizedBox(height: tokens.spacingSm),
            Text(
              const ErrorMapper()
                  .fromCommandError(
                    code: rejected.lastError?.code ?? '',
                    context: rejected.lastError?.context ?? const {},
                  )
                  .userMessage,
              key: const Key('historyDetail.rejection'),
              style: theme.textTheme.titleMedium?.copyWith(
                color: tokens.danger,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EvidenceCard extends StatelessWidget {
  const _EvidenceCard({required this.evidence, required this.photosOnTablet});

  final DetailEvidence evidence;
  final int photosOnTablet;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    Widget message(String text, String key) => Text(
      text,
      key: Key('historyDetail.evidence.$key'),
      style: theme.textTheme.bodyLarge,
    );
    return AppCard(
      key: const Key('historyDetail.evidence'),
      padding: EdgeInsets.all(tokens.spacingLg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppStrings.historyDetailEvidence,
            style: theme.textTheme.labelLarge,
          ),
          SizedBox(height: tokens.spacingSm),
          switch (evidence) {
            EvidenceLoading() => const Center(
              key: Key('historyDetail.evidence.loading'),
              child: CircularProgressIndicator(),
            ),
            EvidenceOffline() => message(
              AppStrings.historyDetailEvidenceOffline,
              'offline',
            ),
            EvidenceNotOnServer() => message(
              AppStrings.historyDetailNotOnServer,
              'notOnServer',
            ),
            EvidenceFailed(:final error) => message(
              '${AppStrings.historyDetailEvidenceFailed} ${error.userMessage}',
              'failed',
            ),
            EvidenceLoaded(:final items) when items.isEmpty => message(
              AppStrings.historyDetailEvidenceNone,
              'none',
            ),
            EvidenceLoaded(:final items) => Wrap(
              spacing: tokens.spacingMd,
              runSpacing: tokens.spacingMd,
              children: [for (final e in items) _Thumbnail(evidence: e)],
            ),
          },
          if (photosOnTablet > 0) ...[
            SizedBox(height: tokens.spacingSm),
            Text(
              '$photosOnTablet ${AppStrings.syncPhotosWaiting}',
              style: theme.textTheme.bodyLarge,
            ),
          ],
        ],
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  const _Thumbnail({required this.evidence});

  final ServerEvidence evidence;

  static String _typeLabel(EvidenceType type) => switch (type) {
    EvidenceType.oldNeedle => AppStrings.photoOldNeedle,
    EvidenceType.brokenFragment => AppStrings.photoBrokenFragment,
    EvidenceType.other => AppStrings.photoOther,
  };

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final url = evidence.url;
    final placeholder = ColoredBox(
      color: theme.colorScheme.surfaceContainerHighest,
      child: Center(
        child: Icon(
          url == null ? Icons.cloud_upload_outlined : Icons.broken_image,
          size: 40,
          color: tokens.neutral,
        ),
      ),
    );
    return SizedBox(
      key: Key('historyDetail.evidence.${evidence.id}'),
      width: 180,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(tokens.radius),
            child: SizedBox(
              width: 180,
              height: 135,
              child: url == null || !evidence.uploaded
                  ? placeholder
                  : Image.network(
                      url,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => placeholder,
                      loadingBuilder: (context, child, progress) =>
                          progress == null
                          ? child
                          : const Center(child: CircularProgressIndicator()),
                    ),
            ),
          ),
          SizedBox(height: tokens.spacingXs),
          Text(
            evidence.uploaded
                ? _typeLabel(evidence.type)
                : '${_typeLabel(evidence.type)} — '
                      '${AppStrings.historyDetailEvidenceNotReady}',
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
