import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/sync/domain/sync_backoff.dart';
import 'package:nexa_mobile/features/sync/domain/sync_command.dart';
import 'package:nexa_mobile/features/sync/domain/sync_repositories.dart';
import 'package:nexa_mobile/features/sync/domain/sync_result.dart';
import 'package:uuid/uuid.dart';

/// [SyncQueue] on `local_sync_queue` (schema v3).
class SyncQueueImpl implements SyncQueue {
  SyncQueueImpl(this._db, {DateTime Function()? now, String Function()? newId})
    : _now = now ?? DateTime.now,
      _newId = newId ?? const Uuid().v4;

  final AppDatabase _db;
  final DateTime Function() _now;
  final String Function() _newId;

  static const _accepted = 'ACCEPTED';

  @override
  Future<SyncCommand> enqueue({
    required String clientTransactionId,
    required SyncCommandType type,
    Map<String, Object?> payload = const {},
    required DateTime occurredAt,
  }) async {
    final now = _now();
    final commandId = _newId();
    await _db
        .into(_db.localSyncQueue)
        .insert(
          LocalSyncQueueCompanion.insert(
            commandId: commandId,
            clientTransactionId: clientTransactionId,
            commandType: type.wire,
            payload: Value(jsonEncode(payload)),
            occurredAt: occurredAt,
            status: SyncCommandStatus.queued.wire,
            createdAt: now,
            updatedAt: now,
          ),
        );
    return (await byId(commandId))!;
  }

  SimpleSelectStatement<$LocalSyncQueueTable, LocalSyncQueueRow> _ordered() =>
      _db.select(_db.localSyncQueue)
        ..orderBy([(t) => OrderingTerm.asc(t.sequence)]);

  @override
  Future<List<SyncCommand>> unresolved() async => _map(
    await (_ordered()..where((t) => t.status.isNotValue(_accepted))).get(),
  );

  @override
  Future<List<SyncCommand>> commandsFor(String clientTransactionId) async =>
      _map(
        await (_ordered()
              ..where((t) => t.clientTransactionId.equals(clientTransactionId)))
            .get(),
      );

  @override
  Future<SyncCommand?> byId(String commandId) async {
    final row = await (_db.select(
      _db.localSyncQueue,
    )..where((t) => t.commandId.equals(commandId))).getSingleOrNull();
    return row == null ? null : _toCommand(row);
  }

  @override
  Future<void> markAccepted(String commandId, SyncResultStatus result) =>
      _write(
        commandId,
        LocalSyncQueueCompanion(
          status: const Value(_accepted),
          lastResult: Value(result.wire),
          nextAttemptAt: const Value(null),
          lastErrorCode: const Value(null),
          lastErrorMessage: const Value(null),
          lastErrorContext: const Value(null),
        ),
      );

  @override
  Future<void> markRejected(String commandId, SyncCommandError error) => _write(
    commandId,
    LocalSyncQueueCompanion(
      status: Value(SyncCommandStatus.rejected.wire),
      lastResult: Value(SyncResultStatus.rejected.wire),
      nextAttemptAt: const Value(null),
      lastErrorCode: Value(error.code),
      lastErrorMessage: Value(error.message),
      lastErrorContext: Value(jsonEncode(error.context)),
    ),
  );

  @override
  Future<void> recordTechnicalFailure(
    Iterable<String> commandIds, {
    required String result,
    SyncCommandError? error,
    required DateTime now,
  }) => _db.transaction(() async {
    for (final id in commandIds) {
      final current = await byId(id);
      if (current == null || !current.isQueued) continue;
      final attempts = current.attemptCount + 1;
      await _write(
        id,
        LocalSyncQueueCompanion(
          attemptCount: Value(attempts),
          nextAttemptAt: Value(now.add(SyncBackoff.delayAfter(attempts))),
          lastResult: Value(result),
          lastErrorCode: Value(error?.code),
          lastErrorMessage: Value(error?.message),
          lastErrorContext: Value(
            error == null ? null : jsonEncode(error.context),
          ),
        ),
      );
    }
  });

  @override
  Future<void> markSkipped(String commandId, String result) =>
      _write(commandId, LocalSyncQueueCompanion(lastResult: Value(result)));

  @override
  Future<void> requeue(String commandId) => _write(
    commandId,
    LocalSyncQueueCompanion(
      status: Value(SyncCommandStatus.queued.wire),
      attemptCount: const Value(0),
      nextAttemptAt: const Value(null),
      lastErrorCode: const Value(null),
      lastErrorMessage: const Value(null),
      lastErrorContext: const Value(null),
    ),
  );

  @override
  Future<void> clearBackoff() =>
      (_db.update(_db.localSyncQueue)
            ..where((t) => t.status.equals(SyncCommandStatus.queued.wire)))
          .write(const LocalSyncQueueCompanion(nextAttemptAt: Value(null)));

  @override
  Future<void> delete(Iterable<String> commandIds) {
    final ids = commandIds.toList();
    if (ids.isEmpty) return Future.value();
    return (_db.delete(
      _db.localSyncQueue,
    )..where((t) => t.commandId.isIn(ids))).go();
  }

  @override
  Future<void> deleteFor(String clientTransactionId) => (_db.delete(
    _db.localSyncQueue,
  )..where((t) => t.clientTransactionId.equals(clientTransactionId))).go();

  Future<void> _write(String commandId, LocalSyncQueueCompanion changes) =>
      (_db.update(_db.localSyncQueue)
            ..where((t) => t.commandId.equals(commandId)))
          .write(changes.copyWith(updatedAt: Value(_now())));

  static List<SyncCommand> _map(List<LocalSyncQueueRow> rows) => [
    for (final r in rows) ?_toCommand(r),
  ];

  static SyncCommand? _toCommand(LocalSyncQueueRow r) {
    final type = SyncCommandType.fromWire(r.commandType);
    if (type == null) return null;
    final code = r.lastErrorCode;
    return SyncCommand(
      sequence: r.sequence,
      commandId: r.commandId,
      clientTransactionId: r.clientTransactionId,
      type: type,
      payload: _object(r.payload),
      occurredAt: r.occurredAt,
      status: SyncCommandStatus.fromWire(r.status),
      createdAt: r.createdAt,
      attemptCount: r.attemptCount,
      nextAttemptAt: r.nextAttemptAt,
      lastResult: r.lastResult,
      lastError: code == null
          ? null
          : SyncCommandError(
              code: code,
              message: r.lastErrorMessage ?? '',
              context: _object(r.lastErrorContext),
            ),
    );
  }

  static Map<String, Object?> _object(String? json) {
    if (json == null) return const {};
    final decoded = jsonDecode(json);
    return decoded is Map<String, Object?> ? decoded : const {};
  }
}
