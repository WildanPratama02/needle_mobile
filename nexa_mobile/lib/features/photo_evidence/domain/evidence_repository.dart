import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';

/// Evidence photos: kept locally until confirmed, uploaded online only
/// (contract matrix `photo_evidence` row, MG-7 — never a sync command).
abstract interface class EvidenceRepository {
  /// Moves [photo] into durable app storage and records it with a fresh
  /// `Idempotency-Key`. Replaces any earlier unconfirmed photo of the same
  /// [type] for this exchange (a retake).
  Future<LocalEvidence> keep({
    required String clientTransactionId,
    required EvidenceType type,
    required CapturedPhoto photo,
  });

  /// Photos of this exchange not yet confirmed by the backend (resume).
  Future<List<LocalEvidence>> pending(String clientTransactionId);

  /// `POST /exchanges/{id}/evidence` multipart. On success the local file and
  /// row are deleted; on failure they stay (status `UPLOAD_FAILED`).
  Future<CommandResult<EvidenceUploadResult>> upload(
    String exchangeId,
    LocalEvidence evidence,
  );

  /// Types already stored on the server (`GET /exchanges/{id}/evidence`,
  /// status `UPLOADED` only).
  Future<CommandResult<List<EvidenceType>>> uploadedTypes(String exchangeId);

  /// Deletes one unconfirmed photo (retake).
  Future<void> discard(LocalEvidence evidence);

  /// Deletes every local photo of an exchange that became terminal.
  Future<void> discardAll(String clientTransactionId);
}
