import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_flow_step.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_controller.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_flow_state.dart';
import 'package:nexa_mobile/features/exchange/presentation/exchange_steps.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/exchange_dialogs.dart';
import 'package:nexa_mobile/features/exchange/presentation/widgets/flow_widgets.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';

/// The exchange wizard (Doc 07 §9–29): one route, the visible screen chosen
/// by [ExchangeFlowState.step], which only the server state moves
/// (Doc 17 §46). Opening it creates a new exchange or resumes this tablet's
/// unfinished one.
class ExchangeFlowScreen extends ConsumerWidget {
  const ExchangeFlowScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(exchangeFlowControllerProvider);
    final controller = ref.read(exchangeFlowControllerProvider.notifier);
    final connectivity = ref.watch(connectivityStatusProvider).value;

    void leave() => context.go(Routes.home);

    Future<void> cancel({String? reason}) async {
      final chosen = await showCancelExchangeDialog(
        context,
        stockIssued: state.exchange?.state.stockIssued ?? false,
        initialReason: reason,
      );
      if (chosen != null) await controller.cancel(chosen);
    }

    final cancellable =
        !state.step.isTerminal &&
        !(state.step == ExchangeFlowStep.starting && state.exchange == null);
    final VoidCallback? onCancel = cancellable ? cancel : null;

    Future<void> onBack() async {
      if (!cancellable || state.startFailed) {
        leave();
        return;
      }
      final choice = await showLeaveExchangeDialog(context);
      switch (choice) {
        case LeaveChoice.stay:
          break;
        case LeaveChoice.keep:
          if (context.mounted) leave();
        case LeaveChoice.cancel:
          if (context.mounted) await cancel();
      }
    }

    final showNotice =
        state.notice != null &&
        !(state.step == ExchangeFlowStep.starting && state.startFailed);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(onBack());
      },
      child: Scaffold(
        backgroundColor: context.tokens.pageBackground,
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _FlowHeader(
              exchangeNumber: state.exchange?.exchangeNumber,
              connectivity: connectivity,
              onClose: onBack,
            ),
            ExchangeProgressBar(step: state.step, broken: state.isBroken),
            if (showNotice)
              FlowNoticeBanner(
                notice: state.notice!,
                onRetry: state.canRetry && !state.busy
                    ? controller.retry
                    : null,
              ),
            Expanded(
              child: _StepBody(
                state: state,
                onCancel: onCancel,
                onCancelWithReason: (reason) => cancel(reason: reason),
                onLeave: leave,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepBody extends StatelessWidget {
  const _StepBody({
    required this.state,
    required this.onCancel,
    required this.onCancelWithReason,
    required this.onLeave,
  });

  final ExchangeFlowState state;
  final VoidCallback? onCancel;
  final void Function(String reason) onCancelWithReason;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) => switch (state.step) {
    ExchangeFlowStep.starting => StartingStep(state: state, onLeave: onLeave),
    ExchangeFlowStep.scanOperator => ScanOperatorStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.confirmOperator => ConfirmOperatorStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.oldNeedleType => OldNeedleStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.exchangeType => ExchangeTypeStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.fragmentCheck => FragmentStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.awaitingConfirmation => AwaitingConfirmationStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.confirmationBlocked => ConfirmationBlockedStep(
      state: state,
      onCancel: () => onCancelWithReason(
        state.confirmation?.status == ConfirmationStatus.expired
            ? AppStrings.confirmationExpiredReason
            : AppStrings.confirmationRejectedReason,
      ),
    ),
    ExchangeFlowStep.evidence => EvidenceStep(state: state, onCancel: onCancel),
    ExchangeFlowStep.newNeedle => NewNeedleStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.issue => IssueStep(state: state, onCancel: onCancel),
    ExchangeFlowStep.storeUsedNeedle => StoreUsedNeedleStep(
      state: state,
      onCancel: onCancel,
    ),
    ExchangeFlowStep.complete => CompleteStep(state: state, onCancel: onCancel),
    ExchangeFlowStep.done => DoneStep(state: state, onLeave: onLeave),
    ExchangeFlowStep.cancelled => CancelledStep(state: state, onLeave: onLeave),
    ExchangeFlowStep.stuck => StuckStep(state: state, onCancel: onCancel),
  };
}

/// Compact navy bar (Home's header colours): title, exchange number,
/// ONLINE/OFFLINE (Doc 07 §32).
class _FlowHeader extends StatelessWidget {
  const _FlowHeader({
    required this.exchangeNumber,
    required this.connectivity,
    required this.onClose,
  });

  final String? exchangeNumber;
  final ConnectivityStatus? connectivity;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final textTheme = Theme.of(context).textTheme;
    return Container(
      color: tokens.headerBackground,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacingSm,
            vertical: tokens.spacingXs,
          ),
          child: Row(
            children: [
              IconButton(
                key: const Key('exchange.close'),
                tooltip: AppStrings.back,
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: onClose,
              ),
              SizedBox(width: tokens.spacingSm),
              Text(
                AppStrings.exchangeTitle,
                style: textTheme.titleLarge?.copyWith(color: Colors.white),
              ),
              if (exchangeNumber != null) ...[
                SizedBox(width: tokens.spacingMd),
                Flexible(
                  child: Text(
                    exchangeNumber!,
                    key: const Key('exchange.number'),
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.titleMedium?.copyWith(
                      color: const Color(0xFFC9CFE0),
                    ),
                  ),
                ),
              ],
              const Spacer(),
              NetworkIndicator(status: connectivity),
              SizedBox(width: tokens.spacingSm),
            ],
          ),
        ),
      ),
    );
  }
}
