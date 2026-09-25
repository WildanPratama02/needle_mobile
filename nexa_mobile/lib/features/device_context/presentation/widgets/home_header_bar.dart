import 'package:flutter/material.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/pill_badge.dart';
import 'package:nexa_mobile/shared/widgets/status_badge.dart';
import 'package:nexa_mobile/shared/widgets/status_dot.dart';

/// Full-width navy status header (Doc 07 §8, Doc 17 §7 reference layout):
/// wordmark, trolley badge, factory, sync status, connection status and PIC.
///
/// Full-bleed by design: this widget is meant to be placed directly under
/// the screen's [SafeArea], with no outer margin or rounding, so it reads as
/// the app's top bar edge-to-edge on a real tablet — only the content cards
/// below it are individually rounded (see `HomeScreen`'s doc comment).
///
/// Doc/reference conflict, resolved: the reference screenshot only shows a
/// sync-status dot ("Tersinkron"), but Doc 07 §32 / Doc 17 §29 also require a
/// distinct ONLINE/OFFLINE connectivity indicator, and `login_flow_test.dart`
/// asserts on it. Both are shown here — sync status and raw connectivity are
/// different facts (Doc 15 §19) and neither doc marks the other as removed.
class HomeHeaderBar extends StatelessWidget {
  const HomeHeaderBar({
    super.key,
    required this.context_,
    required this.picName,
    required this.connectivity,
    required this.sync,
    required this.onSettingsTap,
  });

  final DeviceContextSnapshot context_;
  final String picName;
  final ConnectivityStatus? connectivity;
  final SyncOverview sync;
  final VoidCallback onSettingsTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final textTheme = Theme.of(context).textTheme;
    const onDark = Colors.white;
    const onDarkMuted = Color(0xFFC9CFE0);

    Widget muted(String text) =>
        Text(text, style: textTheme.bodyMedium?.copyWith(color: onDarkMuted));

    return Container(
      width: double.infinity,
      color: tokens.headerBackground,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: tokens.spacingLg,
            vertical: tokens.spacingMd,
          ),
          child: Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: tokens.spacingLg,
            runSpacing: tokens.spacingSm,
            children: [
              Text(
                AppStrings.homeWordmark,
                style: textTheme.titleLarge?.copyWith(color: onDark),
              ),
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: tokens.spacingMd,
                runSpacing: tokens.spacingSm,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      PillBadge(
                        label: 'TROLI ${context_.trolley.code}',
                        backgroundColor: tokens.trolleyPillBackground,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${context_.trolley.code} · ${context_.trolley.name}',
                        style: textTheme.bodySmall?.copyWith(
                          color: onDarkMuted,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    context_.factory.name,
                    style: textTheme.bodyMedium?.copyWith(color: onDark),
                  ),
                  NetworkIndicator(status: connectivity),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      StatusDot(
                        color: sync.allSynced ? tokens.success : tokens.warning,
                      ),
                      SizedBox(width: tokens.spacingXs),
                      muted(sync.allSynced ? 'Tersinkron' : 'Menyinkronkan…'),
                    ],
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      muted('${AppStrings.pic}: '),
                      Text(
                        picName,
                        style: textTheme.bodyMedium?.copyWith(color: onDark),
                      ),
                    ],
                  ),
                  IconButton(
                    key: const Key('home.settings'),
                    tooltip: AppStrings.settings,
                    icon: const Icon(Icons.settings, color: onDark),
                    onPressed: onSettingsTap,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
