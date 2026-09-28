import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Indonesian label of a server Exchange State (CONTEXT.md). A separate
/// vocabulary from the local sync labels (`localSyncStateLabel`) on purpose.
/// `null` = the server does not know the exchange yet.
String exchangeStateLabel(ExchangeState? state) => switch (state) {
  null => AppStrings.historyNotOnServer,
  ExchangeState.created => AppStrings.stateCreated,
  ExchangeState.operatorIdentified => AppStrings.stateOperatorIdentified,
  ExchangeState.needleSelected => AppStrings.stateNeedleSelected,
  ExchangeState.exchangeTypeSelected => AppStrings.stateExchangeTypeSelected,
  ExchangeState.fragmentCheck => AppStrings.stateFragmentCheck,
  ExchangeState.confirmationPending => AppStrings.stateConfirmationPending,
  ExchangeState.evidenceCaptured => AppStrings.stateEvidenceCaptured,
  ExchangeState.newNeedleSelected => AppStrings.stateNewNeedleSelected,
  ExchangeState.needleIssued => AppStrings.stateNeedleIssued,
  ExchangeState.usedNeedleStored => AppStrings.stateUsedNeedleStored,
  ExchangeState.completed => AppStrings.stateCompleted,
  ExchangeState.cancelled => AppStrings.stateCancelled,
};

/// Icon + colour of a server state: done, cancelled, not on the server yet,
/// or still in progress. Always shown with [exchangeStateLabel].
(IconData, Color) exchangeStateStyle(BuildContext context, ExchangeState? s) {
  final tokens = context.tokens;
  return switch (s) {
    ExchangeState.completed => (Icons.check_circle, tokens.success),
    ExchangeState.cancelled => (Icons.cancel, tokens.neutral),
    ExchangeState.confirmationPending => (Icons.hourglass_top, tokens.warning),
    null => (Icons.cloud_off, tokens.neutral),
    _ => (Icons.timelapse, tokens.warning),
  };
}

/// Compact state label for list rows: icon + text + colour.
class ExchangeStateText extends StatelessWidget {
  const ExchangeStateText({super.key, required this.state});

  final ExchangeState? state;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = exchangeStateStyle(context, state);
    final tokens = context.tokens;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 22),
        SizedBox(width: tokens.spacingXs),
        Flexible(
          child: Text(
            exchangeStateLabel(state),
            overflow: TextOverflow.ellipsis,
            maxLines: 2,
            style: Theme.of(context).textTheme.titleSmall
                ?.copyWith(color: color, fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
