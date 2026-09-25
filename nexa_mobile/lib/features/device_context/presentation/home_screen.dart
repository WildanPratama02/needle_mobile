import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:nexa_mobile/app/routes.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/auth/domain/session_state.dart';
import 'package:nexa_mobile/features/auth/presentation/session_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/device_validation_controller.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/cached_context_banner.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/home_header_bar.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/penukaran_hari_ini_card.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/secondary_nav_card.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/stok_troli_card.dart';
import 'package:nexa_mobile/features/device_context/presentation/widgets/tukar_jarum_cta_card.dart';
import 'package:nexa_mobile/features/history/data/history_providers.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// Home (Doc 07 §8, Doc 17 §7): factory / trolley / PIC / connection in a
/// full-width header, "TUKAR JARUM" (Create Exchange, FR-MOB-003) as the one
/// dominant action (Doc 07 §43), then trolley stock, today's exchanges,
/// history and sync as passive info cards — matching the NEXA · Troli
/// reference design.
///
/// Doc/reference conflict, resolved: Doc 07 §8 and Doc 17 §7 both wireframe
/// Home as three stacked nav buttons (New Exchange / Trolley Stock /
/// History) with no dashboard data; the reference design instead shows a
/// live dashboard (current stock, today's counts) alongside the one primary
/// action. This screen follows the reference (the explicit target for this
/// rebuild) while keeping "Tukar Jarum" as the single primary action, per
/// Doc 07 §43 — the stock/history/sync cards are passive information, not
/// competing primary actions, and each still routes through the same
/// `Routes.*` destinations the docs' nav buttons would have used.
///
/// Full-bleed layout: the header spans the full physical screen width with
/// no outer margin or rounding (it is the device's top bar, not a card);
/// only the content cards below it are individually rounded. This screen
/// must never wrap header+content in a shared outer rounded container.
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
    final todayCount = ref.watch(todayExchangeCountProvider(context_.device.id));
    final riwayatSubtitle = switch (todayCount) {
      AsyncData(value: TodayExchangeCountLoaded(:final count)) =>
        '${AppStrings.homeHistorySubtitlePrefix}$count',
      AsyncError() || AsyncData(value: TodayExchangeCountFailed()) =>
        AppStrings.homeHistoryCountUnavailable,
      _ => AppStrings.homeHistorySubtitlePrefix,
    };
    final tokens = context.tokens;

    return Scaffold(
      backgroundColor: tokens.pageBackground,
      body: Column(
        children: [
          HomeHeaderBar(
            context_: context_,
            picName: picName,
            connectivity: connectivity,
            sync: sync,
            onSettingsTap: () => context.push(Routes.settings),
          ),
          if (validation.fromCache)
            CachedContextBanner(cachedSince: context_.fetchedAt),
          Expanded(
            child: SafeArea(
              top: false,
              child: Padding(
                padding: EdgeInsets.all(tokens.spacingLg),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    // Doc 17 targets a landscape Android tablet; below
                    // ~820dp wide, stack and scroll instead of forcing a
                    // cramped two-column split.
                    final content = constraints.maxWidth >= 820
                        ? _TabletLayout(
                            trolleyId: context_.trolley.id,
                            sync: sync,
                            riwayatSubtitle: riwayatSubtitle,
                          )
                        : _StackedLayout(
                            trolleyId: context_.trolley.id,
                            sync: sync,
                            riwayatSubtitle: riwayatSubtitle,
                          );
                    return content;
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabletLayout extends StatelessWidget {
  const _TabletLayout({
    required this.trolleyId,
    required this.sync,
    required this.riwayatSubtitle,
  });

  final String trolleyId;
  final SyncOverview sync;
  final String riwayatSubtitle;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 6,
          child: Column(
            children: [
              Expanded(
                flex: 7,
                child: TukarJarumCtaCard(
                  onTap: () => context.push(Routes.newExchange),
                ),
              ),
              SizedBox(height: tokens.spacingLg),
              Expanded(
                flex: 3,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: SecondaryNavCard(
                        key: const Key('home.history'),
                        icon: Icons.history,
                        title: AppStrings.homeHistoryCardTitle,
                        subtitle: riwayatSubtitle,
                        onTap: () => context.push(Routes.history),
                      ),
                    ),
                    SizedBox(width: tokens.spacingLg),
                    Expanded(
                      child: SecondaryNavCard(
                        icon: Icons.sync,
                        title: AppStrings.homeSyncCardTitle,
                        subtitle: sync.allSynced
                            ? AppStrings.syncAllDone
                            : '${sync.pending} ${AppStrings.homeSyncPending}',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(width: tokens.spacingLg),
        Expanded(
          flex: 4,
          child: Column(
            children: [
              Expanded(flex: 6, child: StokTroliCard(trolleyId: trolleyId)),
              SizedBox(height: tokens.spacingLg),
              const Expanded(flex: 4, child: PenukaranHariIniCard()),
            ],
          ),
        ),
      ],
    );
  }
}

/// Narrow-width (phone/portrait) fallback: same content, stacked and
/// scrollable so nothing overflows.
class _StackedLayout extends StatelessWidget {
  const _StackedLayout({
    required this.trolleyId,
    required this.sync,
    required this.riwayatSubtitle,
  });

  final String trolleyId;
  final SyncOverview sync;
  final String riwayatSubtitle;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return SingleChildScrollView(
      child: Column(
        children: [
          SizedBox(
            height: 220,
            child: TukarJarumCtaCard(
              onTap: () => context.push(Routes.newExchange),
            ),
          ),
          SizedBox(height: tokens.spacingLg),
          SizedBox(height: 260, child: StokTroliCard(trolleyId: trolleyId)),
          SizedBox(height: tokens.spacingLg),
          const SizedBox(height: 200, child: PenukaranHariIniCard()),
          SizedBox(height: tokens.spacingLg),
          SecondaryNavCard(
            key: const Key('home.history'),
            icon: Icons.history,
            title: AppStrings.homeHistoryCardTitle,
            subtitle: riwayatSubtitle,
            onTap: () => context.push(Routes.history),
          ),
          SizedBox(height: tokens.spacingLg),
          SecondaryNavCard(
            icon: Icons.sync,
            title: AppStrings.homeSyncCardTitle,
            subtitle: sync.allSynced
                ? AppStrings.syncAllDone
                : '${sync.pending} ${AppStrings.homeSyncPending}',
          ),
        ],
      ),
    );
  }
}
