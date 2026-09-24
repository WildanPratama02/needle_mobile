import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/device_context/data/device_remote_data_source.dart';
import 'package:nexa_mobile/features/device_context/domain/device_outcomes.dart';
import 'package:nexa_mobile/features/device_context/domain/device_repositories.dart';

class HeartbeatRepositoryImpl implements HeartbeatRepository {
  const HeartbeatRepositoryImpl(this._remote);

  final DeviceRemoteDataSource _remote;

  @override
  Future<HeartbeatOutcome> send({
    required String deviceId,
    required String appVersion,
    required DateTime deviceTime,
  }) async {
    final result = await _remote.heartbeat(
      deviceId: deviceId,
      appVersion: appVersion,
      deviceTime: deviceTime,
    );
    return switch (result) {
      ApiFailure(:final error) => HeartbeatFailed(error),
      ApiSuccess(:final data) => HeartbeatAccepted(
        status: data.status,
        serverTime: data.serverTime,
        clockOffset: data.clockOffsetMs == null
            ? null
            : Duration(milliseconds: data.clockOffsetMs!),
      ),
    };
  }
}
