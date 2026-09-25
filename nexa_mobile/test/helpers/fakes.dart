import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/features/device_context/domain/qr_scanner.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';

class InMemorySecureStore implements SecureStore {
  InMemorySecureStore([Map<String, String>? initial]) : values = {...?initial};

  final Map<String, String> values;

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async => values[key] = value;

  @override
  Future<void> delete(String key) async => values.remove(key);
}

class FakeConnectivitySource implements ConnectivitySource {
  FakeConnectivitySource([this.status = ConnectivityStatus.online]);

  ConnectivityStatus status;
  final _changes = StreamController<ConnectivityStatus>.broadcast();

  void set(ConnectivityStatus next) {
    status = next;
    _changes.add(next);
  }

  @override
  Future<ConnectivityStatus> current() async => status;

  @override
  Stream<ConnectivityStatus> changes() => _changes.stream;
}

/// Stands in for the camera: tests push raw QR strings.
class FakeQrScanner implements QrScanner {
  final _events = StreamController<QrScanEvent>.broadcast();
  bool started = false;

  void scan(String raw) => _events.add(QrScanned(raw));

  void fail() => _events.add(const QrScannerUnavailable());

  @override
  Stream<QrScanEvent> get events => _events.stream;

  @override
  Future<void> start() async => started = true;

  @override
  Future<void> stop() async => started = false;

  @override
  Future<void> dispose() async {}
}

Widget fakePreview(BuildContext context, QrScanner scanner) =>
    const Center(child: Text('camera preview'));

/// Stands in for the camera: every capture writes a small JPEG-named file.
class FakeEvidenceCamera implements EvidenceCamera {
  FakeEvidenceCamera(this.directory);

  final Directory directory;
  EvidenceCameraStatus status = EvidenceCameraStatus.ready;
  int captures = 0;

  /// Bytes of the next photo (override to test the 10 MB guard).
  List<int> bytes = const [0xFF, 0xD8, 0xFF, 0xE0, 1, 2, 3, 4, 0xFF, 0xD9];

  @override
  Future<EvidenceCameraStatus> initialize() async => status;

  @override
  Future<CapturedPhoto?> capture() async {
    captures++;
    final file = File('${directory.path}/camera_$captures.jpg')
      ..writeAsBytesSync(bytes);
    return CapturedPhoto(
      path: file.path,
      mimeType: 'image/jpeg',
      capturedAt: DateTime.utc(2026, 9, 25, 8, captures),
    );
  }

  @override
  Future<void> dispose() async {}
}
