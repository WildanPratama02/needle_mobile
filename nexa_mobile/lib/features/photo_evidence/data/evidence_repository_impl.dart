import 'dart:io';

import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/core/network/api_result.dart';
import 'package:nexa_mobile/core/network/retry_policy.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_remote_data_source.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_camera.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:uuid/uuid.dart';

/// Client-side code for a photo that cannot be sent (missing file, wrong
/// type, over 10 MB) — it never reaches the backend.
const evidenceFileInvalidCode = 'EVIDENCE_FILE_INVALID';

/// `local_exchange_evidence` rows plus files in the app's private storage.
///
/// File work is synchronous on purpose: photos are a few hundred KB and the
/// calls are rare; it keeps the ordering simple (file first, then row).
class EvidenceRepositoryImpl implements EvidenceRepository {
  EvidenceRepositoryImpl({
    required this._db,
    required this._remote,
    required this._retry,
    required this._directory,
    Uuid? uuid,
  }) : _uuid = uuid ?? const Uuid();

  final AppDatabase _db;
  final EvidenceRemoteDataSource _remote;
  final RetryPolicy _retry;
  final Future<Directory> Function() _directory;
  final Uuid _uuid;

  @override
  Future<LocalEvidence> keep({
    required String clientTransactionId,
    required EvidenceType type,
    required CapturedPhoto photo,
  }) async {
    // A retake replaces the unconfirmed photo of the same type.
    for (final old in await pending(clientTransactionId)) {
      if (old.type == type) await discard(old);
    }

    final root = await _directory();
    final folder = Directory('${root.path}/$clientTransactionId')
      ..createSync(recursive: true);
    final id = _uuid.v4();
    final extension = switch (photo.mimeType) {
      'image/png' => 'png',
      'image/webp' => 'webp',
      _ => 'jpg',
    };
    final source = File(photo.path);
    final target = File('${folder.path}/$id.$extension');
    source.copySync(target.path);
    try {
      source.deleteSync();
    } on FileSystemException {
      // Leaving the camera's temp file behind is harmless.
    }

    final evidence = LocalEvidence(
      id: id,
      clientTransactionId: clientTransactionId,
      type: type,
      filePath: target.path,
      mimeType: photo.mimeType,
      byteSize: target.lengthSync(),
      capturedAt: photo.capturedAt,
      idempotencyKey: _uuid.v4(),
      status: LocalEvidenceStatus.captured,
    );
    await _db
        .into(_db.localExchangeEvidence)
        .insert(
          LocalExchangeEvidenceCompanion.insert(
            id: evidence.id,
            clientTransactionId: clientTransactionId,
            evidenceType: type.wire,
            filePath: evidence.filePath,
            mimeType: evidence.mimeType,
            byteSize: evidence.byteSize,
            capturedAt: evidence.capturedAt,
            idempotencyKey: evidence.idempotencyKey,
            uploadStatus: evidence.status.wire,
          ),
        );
    return evidence;
  }

  @override
  Future<List<LocalEvidence>> pending(String clientTransactionId) async {
    final rows =
        await (_db.select(_db.localExchangeEvidence)
              ..where((t) => t.clientTransactionId.equals(clientTransactionId))
              ..orderBy([(t) => OrderingTerm.asc(t.capturedAt)]))
            .get();
    return [
      for (final r in rows)
        if (EvidenceType.fromWire(r.evidenceType) case final type?)
          LocalEvidence(
            id: r.id,
            clientTransactionId: r.clientTransactionId,
            type: type,
            filePath: r.filePath,
            mimeType: r.mimeType,
            byteSize: r.byteSize,
            capturedAt: r.capturedAt,
            idempotencyKey: r.idempotencyKey,
            status: LocalEvidenceStatus.fromWire(r.uploadStatus),
          ),
    ];
  }

  @override
  Future<CommandResult<EvidenceUploadResult>> upload(
    String exchangeId,
    LocalEvidence evidence,
  ) async {
    final file = File(evidence.filePath);
    if (!file.existsSync()) {
      await _deleteRow(evidence.id);
      return CommandFailed(_invalid(EvidenceFileProblem.empty));
    }
    final problem = EvidenceFilePolicy.check(
      mimeType: evidence.mimeType,
      byteSize: file.lengthSync(),
    );
    if (problem != null) return CommandFailed(_invalid(problem));

    final bytes = file.readAsBytesSync();
    final result = await _retry.run(
      () => _remote.upload(
        exchangeId,
        type: evidence.type,
        bytes: bytes,
        fileName: file.uri.pathSegments.last,
        mimeType: evidence.mimeType,
        capturedAt: evidence.capturedAt,
        idempotencyKey: evidence.idempotencyKey,
      ),
    );
    switch (result) {
      case ApiSuccess(:final data):
        // Confirmed by the backend: only now may the local copy go
        // (Doc 17 §20).
        await discard(evidence);
        return CommandOk(data);
      case ApiFailure(:final error):
        await (_db.update(
          _db.localExchangeEvidence,
        )..where((t) => t.id.equals(evidence.id))).write(
          LocalExchangeEvidenceCompanion(
            uploadStatus: Value(LocalEvidenceStatus.uploadFailed.wire),
          ),
        );
        return CommandFailed(error);
    }
  }

  @override
  Future<CommandResult<List<EvidenceType>>> uploadedTypes(
    String exchangeId,
  ) async {
    final result = await _retry.run(() => _remote.uploadedTypes(exchangeId));
    return switch (result) {
      ApiSuccess(:final data) => CommandOk(data),
      ApiFailure(:final error) => CommandFailed(error),
    };
  }

  @override
  Future<void> discard(LocalEvidence evidence) async {
    _deleteFile(evidence.filePath);
    await _deleteRow(evidence.id);
  }

  @override
  Future<void> discardAll(String clientTransactionId) async {
    for (final e in await pending(clientTransactionId)) {
      await discard(e);
    }
    final root = await _directory();
    final folder = Directory('${root.path}/$clientTransactionId');
    if (folder.existsSync()) {
      try {
        folder.deleteSync(recursive: true);
      } on FileSystemException catch (e) {
        AppLogger.warning('evidence', 'could not delete folder: $e');
      }
    }
  }

  Future<void> _deleteRow(String id) => (_db.delete(
    _db.localExchangeEvidence,
  )..where((t) => t.id.equals(id))).go();

  void _deleteFile(String path) {
    final file = File(path);
    try {
      if (file.existsSync()) file.deleteSync();
    } on FileSystemException catch (e) {
      AppLogger.warning('evidence', 'could not delete photo: $e');
    }
  }

  static AppError _invalid(EvidenceFileProblem problem) => AppError(
    category: ErrorCategory.business,
    code: evidenceFileInvalidCode,
    userMessage: switch (problem) {
      EvidenceFileProblem.tooLarge =>
        'Ukuran foto lebih dari 10 MB. Silakan ulangi foto.',
      EvidenceFileProblem.unsupportedType =>
        'Format foto tidak didukung. Silakan ulangi foto.',
      EvidenceFileProblem.empty =>
        'File foto tidak ditemukan. Silakan ulangi foto.',
    },
  );
}
