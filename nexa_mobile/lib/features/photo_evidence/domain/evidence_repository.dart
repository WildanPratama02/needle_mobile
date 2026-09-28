import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';

/// Evidence photos: kept locally until confirmed, uploaded through the
/// multipart endpoint only (contract matrix `photo_evidence` row, MG-7 —
/// never a sync command). While offline an accepted photo waits as
/// [LocalEvidenceStatus.queued]; the sync engine uploads it before the steps
/// that need it.
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

  /// Accepted photos of every exchange waiting for upload
  /// ([LocalEvidenceStatus.queued]), oldest first.
  Future<List<LocalEvidence>> awaitingUpload();

  /// The PIC accepted [evidence] but it cannot be uploaded now: hand it to the
  /// sync engine (same file, same key).
  Future<LocalEvidence> markQueued(LocalEvidence evidence);

  /// `POST /exchanges/{id}/evidence` multipart. On success the local file and
  /// row are deleted; on failure they stay — a queued photo that failed for a
  /// technical reason stays queued, anything else becomes `UPLOAD_FAILED`.
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
