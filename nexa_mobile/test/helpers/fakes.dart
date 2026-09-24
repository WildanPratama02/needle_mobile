import 'dart:async';

import 'package:flutter/material.dart';
import 'package:nexa_mobile/core/connectivity/connectivity.dart';
import 'package:nexa_mobile/core/storage/secure_store.dart';
import 'package:nexa_mobile/features/device_context/domain/qr_scanner.dart';

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
