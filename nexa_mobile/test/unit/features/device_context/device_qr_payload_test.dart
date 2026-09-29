import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/device_context/domain/device_qr_payload.dart';

const _id = '3f1c2b7e-8a4d-4c1e-9b2a-6d5e4f3a2b1c';

DeviceQrRejection? _rejection(String raw) =>
    switch (DeviceQrPayloadParser.parse(raw)) {
      DeviceQrRejected(:final reason) => reason,
      DeviceQrAccepted() => null,
    };

void main() {
  group('DeviceQrPayloadParser.parse (MG-1)', () {
    test('accepts the exact WebApps payload', () {
      final result = DeviceQrPayloadParser.parse(
        '{"type":"needle-device","v":1,"deviceId":"$_id","deviceCode":"TAB-A-01"}',
      );
      expect(result, isA<DeviceQrAccepted>());
      final payload = (result as DeviceQrAccepted).payload;
      expect(payload.deviceId, _id);
      expect(payload.deviceCode, 'TAB-A-01');
    });

    test('normalizes an upper-case UUID and surrounding whitespace', () {
      final result = DeviceQrPayloadParser.parse(
        '  {"type":"needle-device","v":1,"deviceId":"${_id.toUpperCase()}","deviceCode":"X"} ',
      );
      expect((result as DeviceQrAccepted).payload.deviceId, _id);
    });

    test('accepts a payload without deviceCode (display only)', () {
      final result = DeviceQrPayloadParser.parse(
        '{"type":"needle-device","v":1,"deviceId":"$_id"}',
      );
      expect((result as DeviceQrAccepted).payload.deviceCode, isNull);
    });

    test('rejects anything that is not JSON', () {
      expect(_rejection('https://example.com'), DeviceQrRejection.notJson);
      expect(_rejection('[1,2,3]'), DeviceQrRejection.notJson);
      expect(_rejection(''), DeviceQrRejection.notJson);
    });

    test('rejects JSON of another type', () {
      expect(
        _rejection('{"type":"something-else","v":1,"deviceId":"$_id"}'),
        DeviceQrRejection.notDeviceQr,
      );
      expect(
        _rejection('{"v":1,"deviceId":"$_id"}'),
        DeviceQrRejection.notDeviceQr,
      );
    });

    test('rejects a device QR without a numeric version', () {
      expect(
        _rejection('{"type":"needle-device","deviceId":"$_id"}'),
        DeviceQrRejection.notDeviceQr,
      );
      expect(
        _rejection('{"type":"needle-device","v":"1","deviceId":"$_id"}'),
        DeviceQrRejection.notDeviceQr,
      );
    });

    test('rejects any version other than 1', () {
      expect(
        _rejection('{"type":"needle-device","v":2,"deviceId":"$_id"}'),
        DeviceQrRejection.unsupportedVersion,
      );
      expect(
        _rejection('{"type":"needle-device","v":0,"deviceId":"$_id"}'),
        DeviceQrRejection.unsupportedVersion,
      );
    });

    test('rejects a deviceId that is not a UUID', () {
      expect(
        _rejection('{"type":"needle-device","v":1,"deviceId":"TAB-A-01"}'),
        DeviceQrRejection.invalidDeviceId,
      );
      expect(
        _rejection('{"type":"needle-device","v":1,"deviceId":123}'),
        DeviceQrRejection.invalidDeviceId,
      );
      expect(
        _rejection('{"type":"needle-device","v":1}'),
        DeviceQrRejection.invalidDeviceId,
      );
    });
  });

  group('DeviceQrPayloadParser.parseManualDeviceId', () {
    test('accepts and normalizes a UUID', () {
      expect(
        DeviceQrPayloadParser.parseManualDeviceId(' ${_id.toUpperCase()} '),
        _id,
      );
    });

    test('rejects anything else', () {
      expect(DeviceQrPayloadParser.parseManualDeviceId('TAB-A-01'), isNull);
      expect(DeviceQrPayloadParser.parseManualDeviceId(''), isNull);
      expect(DeviceQrPayloadParser.parseManualDeviceId('${_id}0'), isNull);
    });
  });
}
