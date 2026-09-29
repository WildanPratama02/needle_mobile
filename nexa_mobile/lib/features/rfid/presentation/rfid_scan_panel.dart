import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_providers.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_reader.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';

/// "TAP KARTU RFID" (Doc 17 §8). Listens to the active [RfidReader] while
/// shown and hands every debounced UID to [onCard]. When the reader accepts
/// typed input ([ManualUidInput]), a text field is offered as fallback; the
/// parent submits it through [ManualUidEntry.submit].
///
/// Knows nothing about the hardware: the reader comes from
/// [rfidReaderProvider] (Doc 13 §6).
class RfidScanPanel extends ConsumerStatefulWidget {
  const RfidScanPanel({
    super.key,
    required this.onCard,
    required this.enabled,
    this.entry,
  });

  final ValueChanged<String> onCard;

  /// `false` while offline or while a lookup runs: reads are ignored.
  final bool enabled;

  /// Lets the footer's primary action submit the typed UID.
  final ManualUidEntry? entry;

  @override
  ConsumerState<RfidScanPanel> createState() => _RfidScanPanelState();
}

/// Bridge between the footer button and the panel's text field.
class ManualUidEntry {
  _RfidScanPanelState? _panel;

  void submit() => _panel?._submitManual();
}

class _RfidScanPanelState extends ConsumerState<RfidScanPanel> {
  final _manual = TextEditingController();
  late final RfidReader _reader;
  StreamSubscription<String>? _cards;

  @override
  void initState() {
    super.initState();
    widget.entry?._panel = this;
    _reader = ref.read(rfidReaderProvider);
    _cards = _reader.cardStream().listen((uid) {
      if (widget.enabled) widget.onCard(uid);
    });
    unawaited(_reader.initialize());
  }

  @override
  void didUpdateWidget(RfidScanPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.entry != widget.entry) {
      oldWidget.entry?._panel = null;
      widget.entry?._panel = this;
    }
  }

  void _submitManual() {
    final Object reader = _reader;
    if (!widget.enabled || reader is! ManualUidInput) return;
    reader.submit(_manual.text);
    _manual.clear();
  }

  @override
  void dispose() {
    widget.entry?._panel = null;
    unawaited(_cards?.cancel());
    _manual.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Keeps the reader alive (and listening) while this panel is shown.
    ref.watch(rfidReaderProvider);
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final color = widget.enabled
        ? theme.colorScheme.primary
        : theme.colorScheme.outline;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Container(
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: color, width: 3),
              color: color.withValues(alpha: 0.06),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.contactless_outlined, size: 72, color: color),
                SizedBox(height: tokens.spacingSm),
                Text(
                  AppStrings.rfidTapTitle,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(AppStrings.rfidWaiting, style: theme.textTheme.bodyLarge),
              ],
            ),
          ),
        ),
        if (_reader is ManualUidInput) ...[
          SizedBox(width: tokens.spacingLg),
          Expanded(
            child: TextField(
              key: const Key('exchange.rfid.input'),
              controller: _manual,
              enabled: widget.enabled,
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(
                labelText: AppStrings.rfidManualLabel,
                prefixIcon: Icon(Icons.keyboard),
              ),
              onSubmitted: (_) => _submitManual(),
            ),
          ),
        ],
      ],
    );
  }
}
