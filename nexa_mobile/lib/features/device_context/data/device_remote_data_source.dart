import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/device_context/domain/device_context_snapshot.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_versions.dart';

typedef _Json = Map<String, Object?>;

/// `data` of `GET /mobile/bootstrap` (Backend `BootstrapResponseDto`).
final class BootstrapResponseDto {
  const BootstrapResponseDto({
    required this.device,
    required this.factory,
    required this.trolley,
    required this.masterData,
    required this.serverTime,
    required this.syncCursor,
  });

  factory BootstrapResponseDto.fromJson(Object? json) {
    final map = json! as _Json;
    final device = map['device']! as _Json;
    final factory = map['factory']! as _Json;
    final trolley = map['trolley']! as _Json;
    final versions = map['masterDataVersions']! as _Json;

    List<T>? listOf<T>(String key, T Function(_Json) parse) {
      final value = map[key];
      if (value == null) return null;
      return (value as List<Object?>)
          .map((e) => parse(e! as _Json))
          .toList(growable: false);
    }

    return BootstrapResponseDto(
      device: DeviceInfo(
        id: device['id']! as String,
        code: device['deviceCode']! as String,
        name: device['deviceName']! as String,
        status: DeviceStatus.fromWire(device['status'] as String?),
      ),
      factory: FactoryInfo(
        id: factory['id']! as String,
        code: factory['code']! as String,
        name: factory['name']! as String,
        timezone: factory['timezone']! as String,
      ),
      trolley: TrolleyInfo(
        id: trolley['id']! as String,
        code: trolley['code']! as String,
        name: trolley['name']! as String,
        locationId: trolley['locationId']! as String,
      ),
      masterData: MasterDataPayload(
        versions: MasterDataVersions({
          for (final c in MasterDataCollection.values)
            if (versions[c.name] is String) c: versions[c.name]! as String,
        }),
        needleTypes: listOf(
          'needleTypes',
          (n) => NeedleType(
            id: n['id']! as String,
            code: n['code']! as String,
            name: n['name']! as String,
            category: n['category'] as String?,
            unit: n['unit']! as String,
            minimumStock: n['minimumStock']!.toString(),
          ),
        ),
        exchangeTypes: listOf(
          'exchangeTypes',
          (e) => ExchangeType(
            id: e['id']! as String,
            code: e['code']! as String,
            name: e['name']! as String,
            requiresFragmentValidation:
                e['requiresFragmentValidation']! as bool,
          ),
        ),
        storageMappings: listOf(
          'storageMappings',
          (s) => StorageMapping(
            id: s['id']! as String,
            exchangeTypeId: s['exchangeTypeId']! as String,
            storageLocationId: s['storageLocationId']! as String,
            storageLocationCode: s['storageLocationCode']! as String,
            storageLocationName: s['storageLocationName']! as String,
          ),
        ),
      ),
      serverTime: DateTime.parse(map['serverTime']! as String),
      syncCursor: map['syncCursor']! as String,
    );
  }

  final DeviceInfo device;
  final FactoryInfo factory;
  final TrolleyInfo trolley;
  final MasterDataPayload masterData;
  final DateTime serverTime;
  final String syncCursor;
}

/// `data` of `POST /devices/{id}/heartbeat`.
final class HeartbeatResponseDto {
  const HeartbeatResponseDto({
    required this.status,
    required this.serverTime,
    this.clockOffsetMs,
  });

  factory HeartbeatResponseDto.fromJson(Object? json) {
    final map = json! as _Json;
    return HeartbeatResponseDto(
      status: DeviceStatus.fromWire(map['status'] as String?),
      serverTime: DateTime.parse(map['serverTime']! as String),
      clockOffsetMs: (map['clockOffsetMs'] as num?)?.toInt(),
    );
  }

  final DeviceStatus status;
  final DateTime serverTime;
  final int? clockOffsetMs;
}

class DeviceRemoteDataSource {
  const DeviceRemoteDataSource(this._api);

  final ApiClient _api;

  /// `X-Device-ID` is added by the shared client; the backend takes factory
  /// and trolley from the device binding, never from the request.
  Future<ApiResult<BootstrapResponseDto>> bootstrap(MasterDataVersions held) =>
      _api.get(
        '/mobile/bootstrap',
        query: held.toQuery(),
        decode: BootstrapResponseDto.fromJson,
      );

  /// No `Idempotency-Key`: repeating a heartbeat is harmless (Docs/12 §9).
  Future<ApiResult<HeartbeatResponseDto>> heartbeat({
    required String deviceId,
    required String appVersion,
    required DateTime deviceTime,
  }) => _api.post(
    '/devices/$deviceId/heartbeat',
    body: {
      'appVersion': appVersion,
      // Millisecond precision, UTC: the backend validates strict ISO 8601.
      'deviceTime': DateTime.fromMillisecondsSinceEpoch(
        deviceTime.millisecondsSinceEpoch,
        isUtc: true,
      ).toIso8601String(),
    },
    decode: HeartbeatResponseDto.fromJson,
  );
}
