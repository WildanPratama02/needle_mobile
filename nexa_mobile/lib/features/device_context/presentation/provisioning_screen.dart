import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/device_context/data/mobile_scanner_qr_scanner.dart';
import 'package:nexa_mobile/features/device_context/domain/device_qr_payload.dart';
import 'package:nexa_mobile/features/device_context/domain/qr_scanner.dart';
import 'package:nexa_mobile/features/device_context/presentation/provisioning_controller.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';
import 'package:nexa_mobile/shared/widgets/inline_error.dart';

enum _Mode { scan, confirm, manual }

/// First-launch device provisioning (contract matrix MG-1): scan the QR from
/// the WebApps device detail, confirm the device code, store the id. Manual
/// UUID entry is the fallback (emulators, no usable camera).
class ProvisioningScreen extends ConsumerStatefulWidget {
  const ProvisioningScreen({super.key});

  @override
  ConsumerState<ProvisioningScreen> createState() => _ProvisioningScreenState();
}

class _ProvisioningScreenState extends ConsumerState<ProvisioningScreen> {
  _Mode _mode = _Mode.scan;
  DeviceQrPayload? _scanned;
  String? _error;
  bool _saving = false;
  final _manualInput = TextEditingController();

  @override
  void dispose() {
    _manualInput.dispose();
    super.dispose();
  }

  void _onScan(String rawValue) {
    final result = ref
        .read(provisioningControllerProvider.notifier)
        .review(rawValue);
    setState(() {
      switch (result) {
        case DeviceQrAccepted(:final payload):
          _scanned = payload;
          _error = null;
          _mode = _Mode.confirm;
        case DeviceQrRejected(:final reason):
          _error = switch (reason) {
            DeviceQrRejection.notJson => AppStrings.qrNotJson,
            DeviceQrRejection.notDeviceQr => AppStrings.qrNotDeviceQr,
            DeviceQrRejection.unsupportedVersion =>
              AppStrings.qrUnsupportedVersion,
            DeviceQrRejection.invalidDeviceId => AppStrings.qrInvalidDeviceId,
          };
      }
    });
  }

  void _onCameraUnavailable() => setState(() {
    _mode = _Mode.manual;
    _error = AppStrings.provisionCameraUnavailable;
  });

  Future<void> _confirm() async {
    final payload = _scanned;
    if (payload == null) return;
    setState(() => _saving = true);
    await ref.read(provisioningControllerProvider.notifier).confirm(payload);
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _submitManual() async {
    setState(() => _saving = true);
    final error = await ref
        .read(provisioningControllerProvider.notifier)
        .submitManual(_manualInput.text);
    if (!mounted) return;
    setState(() {
      _saving = false;
      _error = error;
    });
  }

  void _switchTo(_Mode mode) => setState(() {
    _mode = mode;
    _error = null;
    _scanned = null;
  });

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(provisioningControllerProvider);
    final notice = state is Unprovisioned ? state.notice : null;
    final tokens = context.tokens;
    final theme = Theme.of(context);

    final pane = switch (_mode) {
      _Mode.scan => _ScanPane(
        onScanned: _onScan,
        onUnavailable: _onCameraUnavailable,
      ),
      _Mode.confirm => _ConfirmPane(payload: _scanned!),
      _Mode.manual => TextField(
        key: const Key('provision.manualInput'),
        controller: _manualInput,
        enabled: !_saving,
        autocorrect: false,
        style: theme.textTheme.bodyLarge,
        decoration: const InputDecoration(
          labelText: AppStrings.provisionManualLabel,
          hintText: AppStrings.provisionManualHint,
          prefixIcon: Icon(Icons.tablet_android),
        ),
        onSubmitted: (_) => unawaited(_submitManual()),
      ),
    };

    final (primary, secondary) = switch (_mode) {
      _Mode.scan => (
        null,
        SecondaryActionButton(
          key: const Key('provision.toManual'),
          label: AppStrings.provisionManualToggle,
          icon: Icons.keyboard,
          onPressed: () => _switchTo(_Mode.manual),
        ),
      ),
      _Mode.confirm => (
        PrimaryActionButton(
          key: const Key('provision.confirm'),
          label: AppStrings.provisionConfirmAction,
          icon: Icons.check,
          busy: _saving,
          onPressed: () => unawaited(_confirm()),
        ),
        SecondaryActionButton(
          label: AppStrings.provisionRescan,
          icon: Icons.qr_code_scanner,
          onPressed: _saving ? null : () => _switchTo(_Mode.scan),
        ),
      ),
      _Mode.manual => (
        PrimaryActionButton(
          key: const Key('provision.manualSave'),
          label: AppStrings.provisionManualSave,
          icon: Icons.save,
          busy: _saving,
          onPressed: () => unawaited(_submitManual()),
        ),
        SecondaryActionButton(
          key: const Key('provision.toScan'),
          label: AppStrings.provisionScanToggle,
          icon: Icons.qr_code_scanner,
          onPressed: _saving ? null : () => _switchTo(_Mode.scan),
        ),
      ),
    };

    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.provisionTitle)),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(tokens.spacingLg),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: tokens.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (notice != null) ...[
                    InlineError(message: notice),
                    SizedBox(height: tokens.spacingLg),
                  ],
                  if (_mode == _Mode.scan) ...[
                    Text(
                      AppStrings.provisionScanHint,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge,
                    ),
                    SizedBox(height: tokens.spacingMd),
                  ],
                  pane,
                  if (_error != null) ...[
                    SizedBox(height: tokens.spacingMd),
                    InlineError(message: _error!),
                  ],
                  SizedBox(height: tokens.spacingLg),
                  ?primary,
                  if (primary != null) SizedBox(height: tokens.spacingMd),
                  secondary,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Owns the camera only while scanning: leaving scan mode disposes the
/// autoDispose scanner and releases the camera.
class _ScanPane extends ConsumerStatefulWidget {
  const _ScanPane({required this.onScanned, required this.onUnavailable});

  final ValueChanged<String> onScanned;
  final VoidCallback onUnavailable;

  @override
  ConsumerState<_ScanPane> createState() => _ScanPaneState();
}

class _ScanPaneState extends ConsumerState<_ScanPane> {
  StreamSubscription<QrScanEvent>? _subscription;

  @override
  void initState() {
    super.initState();
    final scanner = ref.read(qrScannerProvider);
    _subscription = scanner.events.listen((event) {
      if (!mounted) return;
      switch (event) {
        case QrScanned(:final rawValue):
          widget.onScanned(rawValue);
        case QrScannerUnavailable():
          widget.onUnavailable();
      }
    });
    // Start once the preview is in the tree.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) unawaited(scanner.start());
    });
  }

  @override
  void dispose() {
    unawaited(_subscription?.cancel());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scanner = ref.watch(qrScannerProvider);
    final preview = ref.watch(qrScannerPreviewBuilderProvider);
    final tokens = context.tokens;
    return ClipRRect(
      borderRadius: BorderRadius.circular(tokens.radius),
      child: AspectRatio(
        aspectRatio: 4 / 3,
        child: ColoredBox(
          color: Colors.black,
          child: preview(context, scanner),
        ),
      ),
    );
  }
}

class _ConfirmPane extends StatelessWidget {
  const _ConfirmPane({required this.payload});

  final DeviceQrPayload payload;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = context.tokens;
    return Card(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacingLg),
        child: Column(
          children: [
            Icon(Icons.verified, size: 56, color: tokens.success),
            SizedBox(height: tokens.spacingSm),
            Text(
              AppStrings.provisionConfirmTitle,
              style: theme.textTheme.titleLarge,
            ),
            SizedBox(height: tokens.spacingMd),
            Text(
              payload.deviceCode ?? AppStrings.provisionCodeUnknown,
              key: const Key('provision.scannedCode'),
              style: theme.textTheme.displaySmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: tokens.spacingSm),
            Text(payload.deviceId, style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}
