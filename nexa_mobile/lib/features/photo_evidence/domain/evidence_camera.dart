/// Camera access for evidence photos, isolated behind an interface
/// (`nexa_mobile/CLAUDE.md` §4, Doc 13 §6 pattern). `package:camera` is
/// imported only by the implementation in `data/`.
abstract interface class EvidenceCamera {
  /// Opens the back camera. Asks for the permission at this contextual point
  /// (Doc 17 §39).
  Future<EvidenceCameraStatus> initialize();

  /// Takes one compressed photo into a temporary file.
  Future<CapturedPhoto?> capture();

  Future<void> dispose();
}

enum EvidenceCameraStatus { ready, permissionDenied, unavailable }

final class CapturedPhoto {
  const CapturedPhoto({
    required this.path,
    required this.mimeType,
    required this.capturedAt,
  });

  /// Temporary file; the evidence repository moves it to durable storage.
  final String path;
  final String mimeType;
  final DateTime capturedAt;
}
