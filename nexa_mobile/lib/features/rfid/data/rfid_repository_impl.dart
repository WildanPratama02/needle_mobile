import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/features/rfid/data/rfid_remote_data_source.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';

class RfidRepositoryImpl implements RfidRepository {
  const RfidRepositoryImpl(this._remote, this._retry);

  final RfidRemoteDataSource _remote;
  final RetryPolicy _retry;

  @override
  Future<OperatorLookupOutcome> lookup(String rfidUid) async {
    final result = await _retry.run(() => _remote.lookup(rfidUid));
    return switch (result) {
      ApiSuccess(:final data) => OperatorFound(data),
      ApiFailure(:final error) => OperatorLookupFailed(error),
    };
  }
}
