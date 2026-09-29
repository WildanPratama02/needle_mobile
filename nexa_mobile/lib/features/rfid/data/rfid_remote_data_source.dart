import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/rfid/domain/operator_lookup.dart';

typedef _Json = Map<String, Object?>;

class RfidRemoteDataSource {
  const RfidRemoteDataSource(this._api);

  final ApiClient _api;

  /// `GET /rfid/cards/uid/{rfidUid}` (Doc 13 §8; the `/uid/` segment per the
  /// contract matrix DRIFT row). Needs `X-Device-ID` + `MOBILE_OPERATE`.
  Future<ApiResult<RfidOperator>> lookup(String rfidUid) => _api.get(
    '/rfid/cards/uid/${Uri.encodeComponent(rfidUid)}',
    decode: (data) {
      final map = data! as _Json;
      final employee = map['employee']! as _Json;
      return RfidOperator(
        rfidUid: rfidUid,
        employeeId: employee['id']! as String,
        employeeNumber: employee['employeeNumber']! as String,
        name: employee['name']! as String,
        factoryId: employee['factoryId']! as String,
      );
    },
  );
}
