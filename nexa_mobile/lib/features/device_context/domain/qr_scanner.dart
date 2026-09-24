/// Camera QR scanning, isolated behind an interface (`nexa_mobile/CLAUDE.md`
/// §4, Doc 13 §6 pattern). The camera package is imported only by the
/// implementation in `data/`.
abstract interface class QrScanner {
  /// Every decoded QR value, and [QrScannerUnavailable] when the camera cannot
  /// be used (permission denied, no camera, emulator).
  Stream<QrScanEvent> get events;

  Future<void> start();
  Future<void> stop();
  Future<void> dispose();
}

sealed class QrScanEvent {
  const QrScanEvent();
}

final class QrScanned extends QrScanEvent {
  const QrScanned(this.rawValue);

  final String rawValue;
}

final class QrScannerUnavailable extends QrScanEvent {
  const QrScannerUnavailable({this.permissionDenied = false});

  final bool permissionDenied;
}
