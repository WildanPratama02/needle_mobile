import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_controller.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_state.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/flow_widgets.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/needle_type_grid_step.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/needle_type_picker.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/step_layout.dart';
import 'package:nexa_mobile/features/inventory_stock/data/inventory_stock_providers.dart';
import 'package:nexa_mobile/features/inventory_stock/domain/trolley_stock_repository.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/photo_evidence/presentation/evidence_views.dart';
import 'package:nexa_mobile/features/rfid/presentation/rfid_scan_panel.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// On-screen label of an exchange type (Doc 07 §14 wording).
String exchangeTypeLabel(String? code, String? fallbackName) => switch (code) {
  brokenExchangeTypeCode => AppStrings.exchangeTypeBroken,
  'BENT' => AppStrings.exchangeTypeBent,
  'CHANGEOVER' => AppStrings.exchangeTypeChangeover,
  _ => fallbackName ?? code ?? '-',
};

String _needleLabel(ExchangeCatalog catalog, String? id) {
  final needle = catalog.needle(id);
  if (needle == null) return '-';
  return '${needle.code} · ${needle.name}';
}

/// Rows for the issue confirmation, completion and done screens.
List<(String, String)> summaryRows(ExchangeFlowState s, {bool number = true}) {
  final exchange = s.exchange;
  final operator = s.operator;
  return [
    if (number && exchange != null)
      (AppStrings.summaryExchangeNumber, exchange.exchangeNumber),
    (
      AppStrings.summaryOperator,
      operator == null ? '-' : '${operator.employeeNumber} · ${operator.name}',
    ),
    (
      AppStrings.summaryExchangeType,
      exchangeTypeLabel(exchange?.exchangeTypeCode, exchange?.exchangeTypeName),
    ),
    (
      AppStrings.summaryOldNeedle,
      _needleLabel(s.catalog, exchange?.oldNeedleTypeId),
    ),
    (
      AppStrings.summaryNewNeedle,
      _needleLabel(s.catalog, exchange?.newNeedleTypeId),
    ),
  ];
}

typedef StepCancel = VoidCallback?;

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

class StartingStep extends ConsumerWidget {
  const StartingStep({super.key, required this.state, required this.onLeave});

  final ExchangeFlowState state;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    if (!state.startFailed) {
      return const StepLayout(
        key: Key('exchange.step.starting'),
        body: Padding(
          padding: EdgeInsets.all(48),
          child: Column(
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(AppStrings.exchangeStarting),
            ],
          ),
        ),
      );
    }
    return StepLayout(
      key: const Key('exchange.step.startFailed'),
      body: StatusBlock(
        icon: Icons.cloud_off,
        color: context.tokens.warning,
        title: AppStrings.exchangeTitle,
        body: state.notice?.text,
      ),
      primaryLabel: state.canRetry ? AppStrings.retry : AppStrings.backToHome,
      onPrimary: state.canRetry ? controller.retry : onLeave,
      busy: state.busy,
      secondaryLabel: state.canRetry ? AppStrings.back : null,
      onSecondary: onLeave,
    );
  }
}

// ---------------------------------------------------------------------------
// Operator (FR-MOB-004, Doc 17 §8–10)
// ---------------------------------------------------------------------------

class ScanOperatorStep extends ConsumerStatefulWidget {
  const ScanOperatorStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  ConsumerState<ScanOperatorStep> createState() => _ScanOperatorStepState();
}

class _ScanOperatorStepState extends ConsumerState<ScanOperatorStep> {
  final _entry = ManualUidEntry();

  @override
  Widget build(BuildContext context) {
    final state = widget.state;
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final tokens = context.tokens;
    if (state.offline) {
      // MG-6: lookup is online only — say so instead of waiting silently.
      return StepLayout(
        key: const Key('exchange.step.scanOperatorOffline'),
        body: StatusBlock(
          icon: Icons.wifi_off,
          color: tokens.warning,
          title: AppStrings.rfidOfflineTitle,
          body: AppStrings.rfidOffline,
        ),
        onCancel: widget.onCancel,
      );
    }
    return StepLayout(
      key: const Key('exchange.step.scanOperator'),
      body: RfidScanPanel(
        entry: _entry,
        enabled: !state.busy,
        onCard: controller.lookupOperator,
      ),
      primaryLabel: AppStrings.rfidLookup,
      onPrimary: _entry.submit,
      busy: state.busy,
      onCancel: widget.onCancel,
    );
  }
}

class ConfirmOperatorStep extends ConsumerWidget {
  const ConfirmOperatorStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final candidate = state.operatorCandidate!;
    return StepLayout(
      key: const Key('exchange.step.confirmOperator'),
      body: StatusBlock(
        icon: Icons.verified_user,
        color: context.tokens.success,
        title: AppStrings.operatorFound,
        child: SummaryTable(
          rows: [
            (AppStrings.employeeNumber, candidate.employeeNumber),
            (AppStrings.employeeName, candidate.name),
          ],
        ),
      ),
      primaryLabel: AppStrings.operatorConfirm,
      onPrimary: controller.confirmOperator,
      busy: state.busy,
      secondaryLabel: AppStrings.operatorRescan,
      onSecondary: controller.rescanOperator,
      onCancel: onCancel,
    );
  }
}

// ---------------------------------------------------------------------------
// Old needle + exchange type (FR-MOB-005/006, Doc 17 §11–12)
// ---------------------------------------------------------------------------

class OldNeedleStep extends ConsumerWidget {
  const OldNeedleStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    return NeedleTypeGridStep(
      key: const Key('exchange.step.oldNeedleType'),
      title: AppStrings.oldNeedleQuestion,
      needleTypes: state.catalog.needleTypes,
      initial: state.oldNeedle,
      busy: state.busy,
      onCancel: onCancel,
      onContinue: controller.chooseOldNeedle,
    );
  }
}

class ExchangeTypeStep extends ConsumerWidget {
  const ExchangeTypeStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  static IconData _icon(String code) => switch (code) {
    brokenExchangeTypeCode => Icons.broken_image_outlined,
    'BENT' => Icons.turn_right,
    _ => Icons.swap_horiz,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final tokens = context.tokens;
    final types = state.catalog.exchangeTypes;
    final needle = state.oldNeedle;
    return StepLayout(
      key: const Key('exchange.step.exchangeType'),
      title: AppStrings.exchangeTypeQuestion,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (needle != null)
            Text(
              '${AppStrings.needleSelected}: ${needle.code} · ${needle.name}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          SizedBox(height: tokens.spacingMd),
          Wrap(
            spacing: tokens.spacingMd,
            runSpacing: tokens.spacingMd,
            children: [
              for (final type in types)
                SizedBox(
                  width: 280,
                  child: ChoiceCard(
                    key: Key('exchange.type.${type.code}'),
                    icon: _icon(type.code),
                    label: exchangeTypeLabel(type.code, type.name),
                    subtitle: type.name,
                    color: type.code == brokenExchangeTypeCode
                        ? tokens.danger
                        : null,
                    onTap: state.busy
                        ? null
                        : () => controller.selectExchangeType(type),
                  ),
                ),
            ],
          ),
          if (state.busy)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: LinearProgressIndicator(),
            ),
        ],
      ),
      secondaryLabel: AppStrings.changeNeedle,
      onSecondary: controller.changeOldNeedle,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

// ---------------------------------------------------------------------------
// Fragment + confirmation (FR-MOB-007/008, Doc 17 §14–18)
// ---------------------------------------------------------------------------

class FragmentStep extends ConsumerWidget {
  const FragmentStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final tokens = context.tokens;
    return StepLayout(
      key: const Key('exchange.step.fragmentCheck'),
      title: AppStrings.fragmentQuestion,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: ChoiceCard(
                  key: const Key('exchange.fragment.found'),
                  icon: Icons.check_circle_outline,
                  label: AppStrings.fragmentFound,
                  color: tokens.success,
                  onTap: state.busy
                      ? null
                      : () => controller.recordFragment(FragmentStatus.found),
                ),
              ),
              SizedBox(width: tokens.spacingLg),
              Expanded(
                child: ChoiceCard(
                  key: const Key('exchange.fragment.notFound'),
                  icon: Icons.cancel_outlined,
                  label: AppStrings.fragmentNotFound,
                  subtitle: AppStrings.fragmentNotFoundHint,
                  color: tokens.danger,
                  onTap: state.busy
                      ? null
                      : () =>
                            controller.recordFragment(FragmentStatus.notFound),
                ),
              ),
            ],
          ),
          if (state.busy)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: LinearProgressIndicator(),
            ),
        ],
      ),
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

class AwaitingConfirmationStep extends ConsumerWidget {
  const AwaitingConfirmationStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final number = state.confirmation?.confirmationNumber;
    return StepLayout(
      key: const Key('exchange.step.awaitingConfirmation'),
      body: StatusBlock(
        icon: Icons.hourglass_top,
        color: context.tokens.warning,
        title: AppStrings.awaitingTitle,
        body: AppStrings.awaitingBody,
        child: Text(
          number == null
              ? AppStrings.confirmationPendingLabel
              : '${AppStrings.confirmationPendingLabel} · $number',
          style: Theme.of(context).textTheme.titleMedium,
        ),
      ),
      primaryLabel: AppStrings.checkStatus,
      onPrimary: controller.checkConfirmation,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

class ConfirmationBlockedStep extends StatelessWidget {
  const ConfirmationBlockedStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context) {
    final confirmation = state.confirmation;
    final expired = confirmation?.status == ConfirmationStatus.expired;
    final reason = confirmation?.rejectionReason;
    return StepLayout(
      key: const Key('exchange.step.confirmationBlocked'),
      body: StatusBlock(
        icon: Icons.block,
        color: context.tokens.danger,
        title: AppStrings.exchangeBlockedTitle,
        body: expired
            ? AppStrings.confirmationExpired
            : AppStrings.confirmationRejected,
        child: Column(
          children: [
            if (!expired && reason != null)
              SummaryTable(rows: [(AppStrings.confirmationReason, reason)]),
            const SizedBox(height: 8),
            const Text(AppStrings.blockedCancelHint),
          ],
        ),
      ),
      primaryLabel: AppStrings.leaveCancel,
      onPrimary: onCancel,
      busy: state.busy,
    );
  }
}

// ---------------------------------------------------------------------------
// Evidence (FR-MOB-009, Doc 17 §19–20)
// ---------------------------------------------------------------------------

class EvidenceStep extends ConsumerWidget {
  const EvidenceStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final progress = state.evidence;
    final type = progress.current;
    if (!progress.loaded || type == null) {
      return StepLayout(
        key: const Key('exchange.step.evidenceLoading'),
        body: const Padding(
          padding: EdgeInsets.all(48),
          child: Center(child: CircularProgressIndicator()),
        ),
        onCancel: onCancel,
      );
    }
    final required = EvidenceProgressLabel.of(state);
    final title = '${evidenceTypeLabel(type)}$required';
    final pending = progress.pendingPhoto;
    return StepLayout(
      key: const Key('exchange.step.evidence'),
      scrollable: false,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (state.approvedNotice)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: FlowNoticeBanner(
                notice: const FlowNotice(
                  AppStrings.confirmationApprovedBody,
                  FlowNoticeKind.success,
                  title: AppStrings.confirmationApproved,
                ),
              ),
            ),
          Expanded(
            child: pending == null
                ? EvidenceCaptureView(
                    key: ValueKey('capture.${type.wire}'),
                    title: title,
                    enabled: !state.busy,
                    onCaptured: controller.photoCaptured,
                  )
                : EvidenceReviewView(
                    title: title,
                    photo: pending,
                    busy: state.busy,
                    onUse: controller.usePhoto,
                    onRetake: controller.retakePhoto,
                  ),
          ),
        ],
      ),
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

/// " (1 dari 2)" when a BROKEN + FOUND exchange needs two photos.
abstract final class EvidenceProgressLabel {
  static String of(ExchangeFlowState state) {
    final total = state.exchange?.fragmentStatus == FragmentStatus.found
        ? 2
        : 1;
    if (total == 1) return '';
    final remaining = state.evidence.outstanding.length;
    final index = (total - remaining + 1).clamp(1, total);
    return ' ($index ${AppStrings.photoOf} $total)';
  }
}

// ---------------------------------------------------------------------------
// New needle + stock (FR-MOB-010/011, Doc 07 §24, Doc 17 §21–23)
// ---------------------------------------------------------------------------

class NewNeedleStep extends ConsumerWidget {
  const NewNeedleStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final choice = state.newNeedleChoice;
    final exchange = state.exchange!;
    return StepLayout(
      key: const Key('exchange.step.newNeedle'),
      title: AppStrings.newNeedleTitle,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SummaryTable(
            rows: [
              (
                AppStrings.oldNeedleLabel,
                _needleLabel(state.catalog, exchange.oldNeedleTypeId),
              ),
            ],
          ),
          SizedBox(height: tokens.spacingMd),
          Text(AppStrings.newNeedleLabel, style: theme.textTheme.titleMedium),
          SizedBox(height: tokens.spacingSm),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: EdgeInsets.all(tokens.spacingMd),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(tokens.radius),
                    border: Border.all(
                      color: theme.colorScheme.primary,
                      width: 3,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          choice == null
                              ? '-'
                              : '${choice.code} · ${choice.name}',
                          style: theme.textTheme.titleLarge,
                        ),
                      ),
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.primary,
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(width: tokens.spacingMd),
              OutlinedButton(
                key: const Key('exchange.changeNewNeedle'),
                onPressed: state.busy
                    ? null
                    : () async {
                        final picked = await showNeedleTypePickerDialog(
                          context,
                          needleTypes: state.catalog.needleTypes,
                          selectedId: choice?.id,
                        );
                        if (picked != null) {
                          controller.chooseNewNeedleType(picked);
                        }
                      },
                child: const Text(AppStrings.changeNewNeedle),
              ),
            ],
          ),
          SizedBox(height: tokens.spacingMd),
          if (choice != null)
            _StockHint(trolleyId: exchange.trolleyId, needle: choice),
          if (state.stockProblem case final problem?) ...[
            SizedBox(height: tokens.spacingMd),
            _StockProblemPanel(problem: problem),
          ],
        ],
      ),
      primaryLabel: AppStrings.chooseNewNeedle,
      onPrimary: choice == null ? null : controller.selectNewNeedle,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

/// "Stock tersedia: 25 pcs" (Doc 17 §23) — a hint from
/// `GET /inventory/trolleys/{id}`, never a decision (ADR-004).
class _StockHint extends ConsumerWidget {
  const _StockHint({required this.trolleyId, required this.needle});

  final String trolleyId;
  final NeedleType needle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final stock = ref.watch(trolleyStockProvider(trolleyId));
    final text = switch (stock) {
      AsyncData(value: TrolleyStockLoaded(:final items)) => () {
        for (final item in items) {
          if (item.needleTypeId == needle.id) {
            return '${AppStrings.stockOnTrolley}: ${item.quantity} '
                '${needle.unit.toLowerCase()}';
          }
        }
        return '${AppStrings.stockOnTrolley}: 0 ${needle.unit.toLowerCase()}';
      }(),
      AsyncLoading() => '${AppStrings.stockOnTrolley}: …',
      _ => AppStrings.stockUnknown,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          text,
          key: const Key('exchange.stockHint'),
          style: theme.textTheme.titleMedium,
        ),
        Text(AppStrings.stockHintNote, style: theme.textTheme.bodySmall),
      ],
    );
  }
}

class _StockProblemPanel extends StatelessWidget {
  const _StockProblemPanel({required this.problem});

  final StockProblem problem;

  @override
  Widget build(BuildContext context) {
    final needle = problem.needle;
    return FlowNoticeBanner(
      key: const Key('exchange.stockProblem'),
      notice: FlowNotice(
        [
          AppStrings.stockUnavailable,
          if (needle != null) 'Type: ${needle.code}',
          if (problem.availableQuantity != null)
            '${AppStrings.stockAvailableLabel}: ${problem.availableQuantity}',
          AppStrings.stockUnavailableContact,
        ].join('\n'),
        FlowNoticeKind.error,
        title: AppStrings.stockUnavailableTitle,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Issue, storage, complete (FR-MOB-012/013, Doc 17 §24–26)
// ---------------------------------------------------------------------------

class IssueStep extends ConsumerWidget {
  const IssueStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final tokens = context.tokens;
    return StepLayout(
      key: const Key('exchange.step.issue'),
      title: AppStrings.issueTitle,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SummaryTable(rows: summaryRows(state, number: false)),
          SizedBox(height: tokens.spacingMd),
          Text(
            AppStrings.issueHint,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          if (state.stockProblem case final problem?) ...[
            SizedBox(height: tokens.spacingMd),
            _StockProblemPanel(problem: problem),
          ],
        ],
      ),
      primaryLabel: state.stockProblem == null
          ? AppStrings.issueAction
          : AppStrings.retry,
      onPrimary: controller.issueNeedle,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

class StoreUsedNeedleStep extends ConsumerWidget {
  const StoreUsedNeedleStep({
    super.key,
    required this.state,
    required this.onCancel,
  });

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final theme = Theme.of(context);
    final tokens = context.tokens;
    final exchange = state.exchange!;
    final mapping = state.catalog.storageFor(exchange.exchangeTypeId);
    return StepLayout(
      key: const Key('exchange.step.storeUsedNeedle'),
      title: AppStrings.storeTitle,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SummaryTable(
            rows: [
              (
                AppStrings.summaryExchangeType,
                exchangeTypeLabel(
                  exchange.exchangeTypeCode,
                  exchange.exchangeTypeName,
                ),
              ),
            ],
          ),
          SizedBox(height: tokens.spacingMd),
          Text(AppStrings.storeInto, style: theme.textTheme.titleMedium),
          SizedBox(height: tokens.spacingSm),
          Container(
            padding: EdgeInsets.all(tokens.spacingLg),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(20),
            ),
            child: mapping == null
                ? Text(
                    AppStrings.storeUnknownLocation,
                    style: theme.textTheme.bodyLarge,
                  )
                : Row(
                    children: [
                      Icon(
                        Icons.inventory_2,
                        size: 56,
                        color: theme.colorScheme.primary,
                      ),
                      SizedBox(width: tokens.spacingMd),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              mapping.storageLocationName.toUpperCase(),
                              key: const Key('exchange.storageLocation'),
                              style: theme.textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              mapping.storageLocationCode,
                              style: theme.textTheme.titleMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
      primaryLabel: AppStrings.storeAction,
      onPrimary: controller.storeUsedNeedle,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

class CompleteStep extends ConsumerWidget {
  const CompleteStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    return StepLayout(
      key: const Key('exchange.step.complete'),
      title: AppStrings.completeTitle,
      body: SummaryTable(rows: summaryRows(state)),
      primaryLabel: AppStrings.completeAction,
      onPrimary: controller.complete,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}

// ---------------------------------------------------------------------------
// Terminal + stuck
// ---------------------------------------------------------------------------

class DoneStep extends StatelessWidget {
  const DoneStep({super.key, required this.state, required this.onLeave});

  final ExchangeFlowState state;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) => StepLayout(
    key: const Key('exchange.step.done'),
    body: StatusBlock(
      icon: Icons.check_circle,
      color: context.tokens.success,
      title: AppStrings.doneTitle,
      child: Column(
        children: [
          SummaryTable(rows: summaryRows(state)),
          const SizedBox(height: 8),
          const Text(AppStrings.doneStock),
        ],
      ),
    ),
    primaryLabel: AppStrings.doneAction,
    onPrimary: onLeave,
  );
}

class CancelledStep extends StatelessWidget {
  const CancelledStep({super.key, required this.state, required this.onLeave});

  final ExchangeFlowState state;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) => StepLayout(
    key: const Key('exchange.step.cancelled'),
    body: StatusBlock(
      icon: Icons.cancel,
      color: context.tokens.neutral,
      title: AppStrings.cancelledTitle,
      body: state.cancelledAfterIssue
          ? '${AppStrings.cancelledBody}\n${AppStrings.cancelledReversed}'
          : AppStrings.cancelledBody,
      child: state.exchange == null
          ? null
          : Text(
              state.exchange!.exchangeNumber,
              style: Theme.of(context).textTheme.titleMedium,
            ),
    ),
    primaryLabel: AppStrings.backToHome,
    onPrimary: onLeave,
  );
}

class StuckStep extends ConsumerWidget {
  const StuckStep({super.key, required this.state, required this.onCancel});

  final ExchangeFlowState state;
  final StepCancel onCancel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    return StepLayout(
      key: const Key('exchange.step.stuck'),
      body: StatusBlock(
        icon: Icons.help_outline,
        color: context.tokens.warning,
        title: AppStrings.stuckTitle,
        body: AppStrings.stuckBody,
      ),
      primaryLabel: AppStrings.reload,
      onPrimary: controller.refresh,
      busy: state.busy,
      onCancel: onCancel,
    );
  }
}
