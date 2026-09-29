import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:nexa_mobile/features/device_context/domain/qr_scanner.dart';

/// [QrScanner] on `package:mobile_scanner` — the only file that imports it.
///
/// Hardware behaviour (focus, permission prompt, real QR codes) can only be
/// validated on a physical tablet (Doc 07 §58); tests use a fake scanner.
class MobileScannerQrScanner implements QrScanner {
  MobileScannerQrScanner()
    : _controller = MobileScannerController(
        autoStart: false,
        formats: const [BarcodeFormat.qrCode],
        detectionSpeed: DetectionSpeed.noDuplicates,
      ) {
    _controller.addListener(_onState);
    _barcodes = _controller.barcodes.listen((capture) {
      for (final barcode in capture.barcodes) {
        final value = barcode.rawValue;
        if (value != null && value.isNotEmpty) _events.add(QrScanned(value));
      }
    });
  }

  final MobileScannerController _controller;
  final _events = StreamController<QrScanEvent>.broadcast();
  late final StreamSubscription<BarcodeCapture> _barcodes;
  MobileScannerException? _lastError;

  void _onState() {
    final error = _controller.value.error;
    if (error == null || identical(error, _lastError)) return;
    _lastError = error;
    _events.add(
      QrScannerUnavailable(
        permissionDenied:
            error.errorCode == MobileScannerErrorCode.permissionDenied,
      ),
    );
  }

  /// The camera preview. Presentation gets it through
  /// [qrScannerPreviewBuilderProvider], never by importing mobile_scanner.
  Widget buildPreview(BuildContext context) => MobileScanner(
    controller: _controller,
    errorBuilder: (context, error) => const SizedBox.shrink(),
  );

  @override
  Stream<QrScanEvent> get events => _events.stream;

  @override
  Future<void> start() async {
    try {
      await _controller.start();
    } on MobileScannerException catch (e) {
      _lastError = e;
      _events.add(
        QrScannerUnavailable(
          permissionDenied:
              e.errorCode == MobileScannerErrorCode.permissionDenied,
        ),
      );
    }
  }

  @override
  Future<void> stop() => _controller.stop();

  @override
  Future<void> dispose() async {
    _controller.removeListener(_onState);
    await _barcodes.cancel();
    await _controller.dispose();
    await _events.close();
  }
}

/// A fresh scanner per provisioning screen; disposed with it.
final qrScannerProvider = Provider.autoDispose<QrScanner>((ref) {
  final scanner = MobileScannerQrScanner();
  ref.onDispose(scanner.dispose);
  return scanner;
});

/// Builds the live preview for a [QrScanner]. Overridden in tests.
final qrScannerPreviewBuilderProvider =
    Provider<Widget Function(BuildContext, QrScanner)>(
      (ref) =>
          (context, scanner) => scanner is MobileScannerQrScanner
          ? scanner.buildPreview(context)
          : const SizedBox.shrink(),
    );
