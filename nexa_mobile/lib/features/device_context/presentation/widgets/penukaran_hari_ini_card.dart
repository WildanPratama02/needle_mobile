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
                  // Real exchange-type counts (BROKEN/BENT/CHANGEOVER — 3
                  // rows, not the 1-row test fixture) plus the disclaimer
                  // caption don't reliably fit the ~4/10 share of the right
                  // column this card gets on a landscape tablet's actual
                  // (shorter) height. A plain `Column` here sizes to its
                  // content and overflows whatever fixed height `Expanded`
                  // gives it; a single `ListView` — the same bounded-list
                  // pattern `StokTroliCard` already uses for this exact
                  // "fixed card height, data-driven row count" shape —
                  // never overflows regardless of row count or available
                  // height (it scrolls internally instead). The disclaimer
                  // is the list's own last row, not a fixed sibling outside
                  // it, so it never imposes its own minimum-height floor.
                  : ListView.separated(
                      padding: EdgeInsets.zero,
                      itemCount: types.length + 1,
                      separatorBuilder: (_, _) =>
                          SizedBox(height: tokens.spacingXs),
                      itemBuilder: (context, index) {
                        if (index == types.length) {
                          return Text(
                            AppStrings.homeExchangesTodayUnavailable,
                            style: textTheme.bodySmall,
                          );
                        }
                        final type = types[index];
                        return Row(
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
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
