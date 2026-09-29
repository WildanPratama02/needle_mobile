import 'package:camera/camera.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';

/// [EvidenceCamera] on `package:camera` (CameraX on Android) — the only file
/// that imports it.
///
/// Compression: the capture resolution is bounded by
/// [ResolutionPreset.high] (about 1280x720) and the JPEG quality is set to
/// [jpegQuality], which keeps a needle photo far below the backend's 10 MB
/// limit (typically a few hundred KB). Camera behaviour (focus, exposure,
/// permission prompt) can only be validated on the physical tablet
/// (Doc 07 §58); tests use a fake camera.
class CameraPackageEvidenceCamera implements EvidenceCamera {
  CameraPackageEvidenceCamera({this.jpegQuality = 80});

  final int jpegQuality;
  CameraController? _controller;

  @override
  Future<EvidenceCameraStatus> initialize() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) return EvidenceCameraStatus.unavailable;
      final back = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      final controller = CameraController(
        back,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      _controller = controller;
      await controller.initialize();
      try {
        await controller.setJpegImageQuality(jpegQuality);
      } on Object catch (e) {
        // Best effort (camera 0.12.1): unsupported platforms ignore it.
        AppLogger.info('camera', 'jpeg quality not applied: $e');
      }
      return EvidenceCameraStatus.ready;
    } on CameraException catch (e) {
      AppLogger.warning('camera', 'initialize failed: ${e.code}');
      return switch (e.code) {
        'CameraAccessDenied' ||
        'CameraAccessDeniedWithoutPrompt' ||
        'CameraAccessRestricted' => EvidenceCameraStatus.permissionDenied,
        _ => EvidenceCameraStatus.unavailable,
      };
    }
  }

  @override
  Future<CapturedPhoto?> capture() async {
    final controller = _controller;
    if (controller == null ||
        !controller.value.isInitialized ||
        controller.value.isTakingPicture) {
      return null;
    }
    try {
      final file = await controller.takePicture();
      return CapturedPhoto(
        path: file.path,
        mimeType: EvidenceFilePolicy.mimeTypeFor(file.path) ?? 'image/jpeg',
        capturedAt: DateTime.now(),
      );
    } on CameraException catch (e) {
      AppLogger.warning('camera', 'capture failed: ${e.code}');
      return null;
    }
  }

  /// The live preview. Presentation gets it through
  /// [evidenceCameraPreviewBuilderProvider], never by importing the package.
  Widget buildPreview(BuildContext context) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const SizedBox.shrink();
    }
    return CameraPreview(controller);
  }

  @override
  Future<void> dispose() async {
    final controller = _controller;
    _controller = null;
    await controller?.dispose();
  }
}

/// Alive while the capture view is shown.
final evidenceCameraProvider = Provider.autoDispose<EvidenceCamera>((ref) {
  final camera = CameraPackageEvidenceCamera();
  ref.onDispose(camera.dispose);
  return camera;
});

typedef EvidenceCameraPreviewBuilder = Widget Function(
  BuildContext context,
  EvidenceCamera camera,
);

/// Overridden in tests with a placeholder (no camera plugin there).
final evidenceCameraPreviewBuilderProvider =
    Provider<EvidenceCameraPreviewBuilder>(
      (ref) =>
          (context, camera) => camera is CameraPackageEvidenceCamera
          ? camera.buildPreview(context)
          : const SizedBox.shrink(),
    );
