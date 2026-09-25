import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/app_card.dart';

/// "PENUKARAN HARI INI" — today's exchange counts by exchange type.
///
/// Contract gap, not silently papered over: Docs/12 has a transaction-list
/// endpoint (`GET /exchanges`, filterable by `exchangeTypeId`) but no
/// aggregate-by-type-per-day endpoint. Row labels are real (the bootstrap
/// exchange-type cache); the count itself is intentionally not fabricated —
/// see `.scratch/mobile-troli-app/issues/` for the follow-up ticket that
/// tracks the missing aggregate endpoint.
class PenukaranHariIniCard extends ConsumerWidget {
  const PenukaranHariIniCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = Theme.of(context).textTheme;
    final tokens = context.tokens;
    final exchangeTypes = ref.watch(exchangeTypesProvider);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(AppStrings.homeExchangesTodayTitle, style: textTheme.titleMedium),
          SizedBox(height: tokens.spacingMd),
          Expanded(
            child: exchangeTypes.when(
              loading: () => const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              error: (error, stackTrace) => Text(
                AppStrings.homeExchangesTodayUnavailable,
                style: textTheme.bodySmall,
              ),
              data: (types) => types.isEmpty
                  ? Text(
                      AppStrings.homeExchangesTodayUnavailable,
                      style: textTheme.bodySmall,
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        for (final type in types)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 5),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    type.name,
                                    style: textTheme.bodyMedium,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  '—',
                                  style: textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        SizedBox(height: tokens.spacingXs),
                        Text(
                          AppStrings.homeExchangesTodayUnavailable,
                          style: textTheme.bodySmall,
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
