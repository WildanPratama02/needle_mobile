import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/features/photo_evidence/data/camera_evidence_camera.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';
import 'package:nexa_mobile/shared/l10n/app_strings.dart';
import 'package:nexa_mobile/shared/theme/design_tokens.dart';
import 'package:nexa_mobile/shared/widgets/action_buttons.dart';

String evidenceTypeLabel(EvidenceType type) => switch (type) {
  EvidenceType.oldNeedle => AppStrings.photoOldNeedle,
  EvidenceType.brokenFragment => AppStrings.photoBrokenFragment,
  EvidenceType.other => AppStrings.photoOther,
};

/// Camera preview + "AMBIL FOTO" (Doc 17 §19, §38). Opens the camera when
/// shown, closes it when gone. Permission is asked here, in context
/// (Doc 17 §39).
class EvidenceCaptureView extends ConsumerStatefulWidget {
  const EvidenceCaptureView({
    super.key,
    required this.title,
    required this.onCaptured,
    required this.enabled,
  });

  final String title;
  final ValueChanged<CapturedPhoto> onCaptured;
  final bool enabled;

  @override
  ConsumerState<EvidenceCaptureView> createState() =>
      _EvidenceCaptureViewState();
}

class _EvidenceCaptureViewState extends ConsumerState<EvidenceCaptureView> {
  late final EvidenceCamera _camera;
  EvidenceCameraStatus? _status;
  bool _capturing = false;

  @override
  void initState() {
    super.initState();
    _camera = ref.read(evidenceCameraProvider);
    unawaited(_open());
  }

  Future<void> _open() async {
    setState(() => _status = null);
    final status = await _camera.initialize();
    if (mounted) setState(() => _status = status);
  }

  Future<void> _capture() async {
    setState(() => _capturing = true);
    final photo = await _camera.capture();
    if (!mounted) return;
    setState(() => _capturing = false);
    if (photo != null) widget.onCaptured(photo);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(evidenceCameraProvider);
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final preview = ref.watch(evidenceCameraPreviewBuilderProvider);
    final status = _status;
    final Widget viewport = switch (status) {
      null => const Center(
        child: Text(
          AppStrings.photoCameraStarting,
          style: TextStyle(color: Colors.white),
        ),
      ),
      EvidenceCameraStatus.ready => preview(context, _camera),
      EvidenceCameraStatus.permissionDenied => _CameraProblem(
        text: AppStrings.photoPermissionDenied,
        onRetry: _open,
      ),
      EvidenceCameraStatus.unavailable => _CameraProblem(
        text: AppStrings.photoCameraUnavailable,
        onRetry: _open,
      ),
    };
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(tokens.radius),
            child: ColoredBox(
              color: Colors.black,
              child: Center(child: viewport),
            ),
          ),
        ),
        SizedBox(width: tokens.spacingLg),
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  widget.title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: tokens.spacingSm),
                Text(
                  AppStrings.photoRequired,
                  style: theme.textTheme.bodyLarge,
                ),
                SizedBox(height: tokens.spacingLg),
                PrimaryActionButton(
                  key: const Key('evidence.capture'),
                  label: AppStrings.photoCapture,
                  icon: Icons.camera_alt,
                  busy: _capturing,
                  onPressed:
                      widget.enabled &&
                          status == EvidenceCameraStatus.ready &&
                          !_capturing
                      ? _capture
                      : null,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CameraProblem extends StatelessWidget {
  const _CameraProblem({required this.text, required this.onRetry});

  final String text;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.no_photography, color: Colors.white, size: 48),
        const SizedBox(height: 12),
        Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white, fontSize: 18),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: onRetry,
          style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
          child: const Text(AppStrings.retry),
        ),
      ],
    ),
  );
}

/// "Review Foto" (Doc 17 §20): ULANGI / GUNAKAN FOTO. The file stays on the
/// tablet until the upload is confirmed.
class EvidenceReviewView extends StatefulWidget {
  const EvidenceReviewView({
    super.key,
    required this.title,
    required this.photo,
    required this.busy,
    required this.onUse,
    required this.onRetake,
  });

  final String title;
  final LocalEvidence photo;
  final bool busy;
  final VoidCallback onUse;
  final VoidCallback onRetake;

  @override
  State<EvidenceReviewView> createState() => _EvidenceReviewViewState();
}

class _EvidenceReviewViewState extends State<EvidenceReviewView> {
  Uint8List? _bytes;
  String? _loadedPath;

  /// Read once into memory: no file handle stays open while the preview is
  /// shown, so the file can be deleted as soon as the upload is confirmed
  /// (an open handle blocks deletion on some platforms).
  Uint8List? _load() {
    final path = widget.photo.filePath;
    if (_loadedPath != path) {
      _loadedPath = path;
      try {
        _bytes = File(path).readAsBytesSync();
      } on FileSystemException {
        _bytes = null;
      }
    }
    return _bytes;
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final theme = Theme.of(context);
    final photo = widget.photo;
    final busy = widget.busy;
    final title = widget.title;
    final onUse = widget.onUse;
    final onRetake = widget.onRetake;
    final failed = photo.status == LocalEvidenceStatus.uploadFailed;
    final bytes = _load();
    const unavailable = Center(
      child: Text(
        AppStrings.photoPreviewUnavailable,
        style: TextStyle(color: Colors.white),
      ),
    );
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          flex: 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(tokens.radius),
            child: ColoredBox(
              color: Colors.black,
              child: bytes == null
                  ? unavailable
                  : Image.memory(
                      bytes,
                      fit: BoxFit.contain,
                      cacheWidth: 1280,
                      gaplessPlayback: true,
                      errorBuilder: (context, error, stackTrace) => unavailable,
                    ),
            ),
          ),
        ),
        SizedBox(width: tokens.spacingLg),
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (failed) ...[
                  SizedBox(height: tokens.spacingSm),
                  Text(
                    AppStrings.photoUploadFailed,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: tokens.danger,
                    ),
                  ),
                ],
                SizedBox(height: tokens.spacingLg),
                PrimaryActionButton(
                  key: const Key('evidence.use'),
                  label: failed ? AppStrings.retry : AppStrings.photoUse,
                  icon: Icons.cloud_upload,
                  busy: busy,
                  onPressed: onUse,
                ),
                SizedBox(height: tokens.spacingMd),
                SecondaryActionButton(
                  key: const Key('evidence.retake'),
                  label: AppStrings.photoRetake,
                  icon: Icons.replay,
                  onPressed: busy ? null : onRetake,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
