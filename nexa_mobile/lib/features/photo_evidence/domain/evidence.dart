import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// Evidence type (CONTEXT.md "Evidence"; `EvidenceType` on the backend).
enum EvidenceType {
  oldNeedle('OLD_NEEDLE'),
  brokenFragment('BROKEN_FRAGMENT'),
  other('OTHER');

  const EvidenceType(this.wire);

  final String wire;

  static EvidenceType? fromWire(String? value) {
    for (final t in values) {
      if (t.wire == value) return t;
    }
    return null;
  }
}

/// Mirror of `Backend/src/modules/exchange/services/evidence-policy.ts`
/// (round 4 Q9) — used to know which photo to ask for next. The backend
/// re-checks on every upload and answers `outstanding`, which wins.
///
/// - `OLD_NEEDLE` always;
/// - `BROKEN_FRAGMENT` only when Fragment Status is `FOUND`;
/// - `OTHER` never required.
abstract final class EvidencePolicy {
  static List<EvidenceType> required(FragmentStatus? fragmentStatus) => [
    EvidenceType.oldNeedle,
    if (fragmentStatus == FragmentStatus.found) EvidenceType.brokenFragment,
  ];

  static List<EvidenceType> missing(
    FragmentStatus? fragmentStatus,
    Iterable<EvidenceType> uploaded,
  ) {
    final present = uploaded.toSet();
    return required(fragmentStatus)
        .where((t) => !present.contains(t))
        .toList(growable: false);
  }

  static bool isComplete(
    FragmentStatus? fragmentStatus,
    Iterable<EvidenceType> uploaded,
  ) => missing(fragmentStatus, uploaded).isEmpty;
}

/// The upload limits of `POST /exchanges/{id}/evidence`
/// (`evidence.service.ts`): jpeg / png / webp, at most 10 MB.
abstract final class EvidenceFilePolicy {
  static const maxBytes = 10 * 1024 * 1024;
  static const allowedMimeTypes = {'image/jpeg', 'image/png', 'image/webp'};

  static EvidenceFileProblem? check({
    required String mimeType,
    required int byteSize,
  }) {
    if (!allowedMimeTypes.contains(mimeType)) {
      return EvidenceFileProblem.unsupportedType;
    }
    if (byteSize <= 0) return EvidenceFileProblem.empty;
    if (byteSize > maxBytes) return EvidenceFileProblem.tooLarge;
    return null;
  }

  /// MIME type from a file name; `null` when not an accepted image.
  static String? mimeTypeFor(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return null;
  }
}

enum EvidenceFileProblem { unsupportedType, empty, tooLarge }

/// Local photo state (Doc 17 §48). `UPLOADED` is not stored: the row and the
/// file are deleted once the backend confirmed the upload.
enum LocalEvidenceStatus {
  captured('CAPTURED'),
  uploadFailed('UPLOAD_FAILED');

  const LocalEvidenceStatus(this.wire);

  final String wire;

  static LocalEvidenceStatus fromWire(String value) =>
      value == uploadFailed.wire ? uploadFailed : captured;
}

/// A photo kept on the tablet until its upload is confirmed.
final class LocalEvidence {
  const LocalEvidence({
    required this.id,
    required this.clientTransactionId,
    required this.type,
    required this.filePath,
    required this.mimeType,
    required this.byteSize,
    required this.capturedAt,
    required this.idempotencyKey,
    required this.status,
  });

  final String id;
  final String clientTransactionId;
  final EvidenceType type;
  final String filePath;
  final String mimeType;
  final int byteSize;
  final DateTime capturedAt;

  /// One key per photo: every resend of this photo reuses it; a retake is a
  /// new photo with a new key.
  final String idempotencyKey;
  final LocalEvidenceStatus status;
}

/// The upload answer (`UploadEvidenceResponseDto`).
final class EvidenceUploadResult {
  const EvidenceUploadResult({
    required this.exchangeState,
    required this.outstanding,
  });

  /// `EVIDENCE_CAPTURED` once the mandatory set is complete.
  final ExchangeState? exchangeState;

  /// Mandatory types still missing, per the backend.
  final List<EvidenceType> outstanding;
}
