import 'package:nexa_mobile/core/network/api_client.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';

typedef _Json = Map<String, Object?>;

class EvidenceRemoteDataSource {
  const EvidenceRemoteDataSource(this._api);

  final ApiClient _api;

  /// `POST /exchanges/{id}/evidence` (multipart: `file`, `evidenceType`,
  /// `capturedAt`), with one `Idempotency-Key` per photo.
  Future<ApiResult<EvidenceUploadResult>> upload(
    String exchangeId, {
    required EvidenceType type,
    required List<int> bytes,
    required String fileName,
    required String mimeType,
    required DateTime capturedAt,
    required String idempotencyKey,
  }) => _api.postMultipart(
    '/exchanges/$exchangeId/evidence',
    fields: {
      'evidenceType': type.wire,
      'capturedAt': capturedAt.toUtc().toIso8601String(),
    },
    file: MultipartUpload(
      field: 'file',
      bytes: bytes,
      fileName: fileName,
      mimeType: mimeType,
    ),
    idempotencyKey: idempotencyKey,
    decode: (data) {
      final map = data! as _Json;
      final outstanding = (map['outstanding'] as List<Object?>? ?? const [])
          .map((e) => EvidenceType.fromWire(e as String?))
          .whereType<EvidenceType>()
          .toList(growable: false);
      return EvidenceUploadResult(
        exchangeState: ExchangeState.fromWire(map['exchangeStatus'] as String?),
        outstanding: outstanding,
      );
    },
  );

  /// `GET /exchanges/{id}/evidence` → the types whose upload succeeded.
  Future<ApiResult<List<EvidenceType>>> uploadedTypes(String exchangeId) =>
      _api.get(
        '/exchanges/$exchangeId/evidence',
        decode: (data) => [
          for (final item in (data! as List<Object?>).cast<_Json>())
            if (item['status'] == 'UPLOADED')
              ?EvidenceType.fromWire(item['evidenceType'] as String?),
        ],
      );

  /// `GET /exchanges/{id}/evidence` → every row, with its read URL.
  Future<ApiResult<List<ServerEvidence>>> list(String exchangeId) => _api.get(
    '/exchanges/$exchangeId/evidence',
    decode: (data) => [
      for (final item in (data! as List<Object?>).cast<_Json>())
        if (EvidenceType.fromWire(item['evidenceType'] as String?)
            case final type?)
          ServerEvidence(
            id: item['id']! as String,
            type: type,
            uploaded: item['status'] == 'UPLOADED',
            url: item['url'] as String?,
            capturedAt: item['capturedAt'] is String
                ? DateTime.tryParse(item['capturedAt']! as String)
                : null,
          ),
    ],
  );
}
