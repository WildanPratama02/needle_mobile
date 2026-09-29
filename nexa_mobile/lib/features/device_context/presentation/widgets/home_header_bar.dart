import 'package:flutter/material.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/sync/presentation/sync_status.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/pill_badge.dart';

/// Full-width navy status header (Doc 07 §8, Doc 17 §7 reference layout):
/// wordmark, trolley badge, factory, one status pill and PIC.
///
/// Full-bleed by design: this widget is meant to be placed directly under
/// the screen's [SafeArea], with no outer margin or rounding, so it reads as
/// the app's top bar edge-to-edge on a real tablet — only the content cards
/// below it are individually rounded (see `HomeScreen`'s doc comment).
///
/// Each fact appears once: the trolley code only in the badge (its name only
/// when it says more than the code, see [trolleyNameIfDistinct]), and
/// connection + sync merged into one [SyncStatusPill] (ONLINE / OFFLINE /
/// SINKRONISASI… / SINKRON GAGAL, plus pending count) — Doc 07 §32 and Doc
/// 17 §29 ask for the status indicator, Doc 15 §19 for the sync state; the
/// footer keeps the counts and last-sync time.
class HomeHeaderBar extends StatelessWidget {
  const HomeHeaderBar({
    super.key,
    required this.context_,
    required this.picName,
    required this.sync,
    required this.onSettingsTap,
    this.onStatusTap,
  });

  final DeviceContextSnapshot context_;
  final String picName;
  final SyncOverview sync;
  final VoidCallback onSettingsTap;

  /// Opens the Pending Sync screen from the status pill.
  final VoidCallback? onStatusTap;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final textTheme = Theme.of(context).textTheme;
    const onDark = Colors.white;
    const onDarkMuted = Color(0xFFC9CFE0);

    final trolleyName = trolleyNameIfDistinct(
      context_.trolley.code,
      context_.trolley.name,
    );

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
                        key: const Key('home.trolley'),
                        label: 'TROLI ${context_.trolley.code}',
                        backgroundColor: tokens.trolleyPillBackground,
                      ),
                      if (trolleyName != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          trolleyName,
                          key: const Key('home.trolleyName'),
                          style: textTheme.bodySmall?.copyWith(
                            color: onDarkMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    context_.factory.name,
                    style: textTheme.bodyMedium?.copyWith(color: onDark),
                  ),
                  SyncStatusPill(sync: sync, onTap: onStatusTap),
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

/// The trolley's name when it tells the PIC more than the code already in
/// the badge — `null` when it is just the code or "Trolley <code>"
/// (case-insensitive, trimmed), or empty.
String? trolleyNameIfDistinct(String code, String name) {
  final n = name.trim();
  final c = code.trim().toLowerCase();
  final lower = n.toLowerCase();
  if (n.isEmpty || lower == c) return null;
  if (lower.startsWith('trolley') &&
      lower.substring('trolley'.length).trim() == c) {
    return null;
  }
  return n;
}
