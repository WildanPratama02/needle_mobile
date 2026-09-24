import 'dart:convert';

/// The device-id QR shown in WebApps → Administration → Devices → Details
/// (contract matrix MG-1):
///
/// ```json
/// {"type":"needle-device","v":1,"deviceId":"<uuid>","deviceCode":"<code>"}
/// ```
///
/// Identifiers only, no secret: the id is confirmed straight away by
/// `GET /mobile/bootstrap`.
final class DeviceQrPayload {
  const DeviceQrPayload({required this.deviceId, this.deviceCode});

  /// Lower-cased canonical UUID, sent as `X-Device-ID`.
  final String deviceId;

  /// For showing the operator which device was learned — never used for
  /// authorization.
  final String? deviceCode;
}

enum DeviceQrRejection {
  /// Not a JSON object at all (any other QR code).
  notJson,

  /// JSON, but not `type: "needle-device"` with a version.
  notDeviceQr,

  /// A device QR from a format version this build does not know.
  unsupportedVersion,

  /// `deviceId` missing or not a UUID.
  invalidDeviceId,
}

sealed class DeviceQrParseResult {
  const DeviceQrParseResult();
}

final class DeviceQrAccepted extends DeviceQrParseResult {
  const DeviceQrAccepted(this.payload);

  final DeviceQrPayload payload;
}

final class DeviceQrRejected extends DeviceQrParseResult {
  const DeviceQrRejected(this.reason);

  final DeviceQrRejection reason;
}

final _uuidPattern = RegExp(
  r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
  caseSensitive: false,
);

/// `true` for a canonical 8-4-4-4-12 hex UUID (what the backend's device
/// context guard requires, `400 DEVICE_CONTEXT_REQUIRED` otherwise).
bool isUuid(String value) => _uuidPattern.hasMatch(value);

abstract final class DeviceQrPayloadParser {
  static const supportedType = 'needle-device';
  static const supportedVersion = 1;

  /// Accepts only `type == "needle-device"`, `v == 1` and a UUID `deviceId`;
  /// any other version is rejected so an older build never misreads a newer
  /// format.
  static DeviceQrParseResult parse(String raw) {
    final Object? decoded;
    try {
      decoded = jsonDecode(raw.trim());
    } on FormatException {
      return const DeviceQrRejected(DeviceQrRejection.notJson);
    }
    if (decoded is! Map<String, Object?>) {
      return const DeviceQrRejected(DeviceQrRejection.notJson);
    }
    if (decoded['type'] != supportedType) {
      return const DeviceQrRejected(DeviceQrRejection.notDeviceQr);
    }
    final version = decoded['v'];
    if (version is! num) {
      return const DeviceQrRejected(DeviceQrRejection.notDeviceQr);
    }
    if (version != supportedVersion) {
      return const DeviceQrRejected(DeviceQrRejection.unsupportedVersion);
    }
    final deviceId = decoded['deviceId'];
    if (deviceId is! String || !isUuid(deviceId.trim())) {
      return const DeviceQrRejected(DeviceQrRejection.invalidDeviceId);
    }
    final code = decoded['deviceCode'];
    return DeviceQrAccepted(
      DeviceQrPayload(
        deviceId: deviceId.trim().toLowerCase(),
        deviceCode: code is String && code.trim().isNotEmpty
            ? code.trim()
            : null,
      ),
    );
  }

  /// Manual-entry fallback (emulators, a camera that cannot focus): the UUID
  /// copied from the same WebApps dialog. Returns the normalized id or `null`.
  static String? parseManualDeviceId(String input) {
    final value = input.trim();
    return isUuid(value) ? value.toLowerCase() : null;
  }
}
