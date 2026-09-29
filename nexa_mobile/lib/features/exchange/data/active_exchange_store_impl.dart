import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/core/logging/app_logger.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';

/// `local_exchange` (schema v3). The wizard works on one exchange at a time;
/// finished ones stay until their sync is confirmed and the retention period
/// has passed.
class ActiveExchangeStoreImpl implements ActiveExchangeStore {
  ActiveExchangeStoreImpl(this._db, {DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final AppDatabase _db;
  final DateTime Function() _now;

  @override
  Future<LocalExchangeRecord?> current(String deviceId) async {
    final rows = await (_db.select(
      _db.localExchange,
    )..orderBy([(t) => OrderingTerm.desc(t.createdAt)])).get();
    LocalExchangeRow? found;
    for (final row in rows) {
      if (row.deviceId != deviceId) {
        await _dropForeign(row);
        continue;
      }
      if (row.closedAt != null) continue;
      if (ExchangeState.fromWire(row.lastKnownStatus)?.isTerminal ?? false) {
        continue;
      }
      found ??= row;
    }
    return found == null ? null : _toRecord(found);
  }

  /// A row opened under a previous device binding is never resumed here. It
  /// is deleted unless steps of it still wait in the queue — those are kept
  /// (the engine never sends them under another device id) rather than lost.
  Future<void> _dropForeign(LocalExchangeRow row) async {
    final waiting =
        await (_db.select(_db.localSyncQueue)..where(
              (t) =>
                  t.clientTransactionId.equals(row.clientTransactionId) &
                  t.status.isNotValue('ACCEPTED'),
            ))
            .get();
    if (waiting.isNotEmpty) {
      AppLogger.warning(
        'exchange',
        'exchange of another device kept: ${waiting.length} unsent step(s)',
      );
      return;
    }
    await forget(row.clientTransactionId);
  }

  @override
  Future<LocalExchangeRecord?> byId(String clientTransactionId) async {
    final row = await _row(clientTransactionId);
    return row == null ? null : _toRecord(row);
  }

  Future<LocalExchangeRow?> _row(String id) => (_db.select(
    _db.localExchange,
  )..where((t) => t.clientTransactionId.equals(id))).getSingleOrNull();

  @override
  Future<List<LocalExchangeRecord>> all() async {
    final rows = await (_db.select(
      _db.localExchange,
    )..orderBy([(t) => OrderingTerm.desc(t.createdAt)])).get();
    return rows.map(_toRecord).toList(growable: false);
  }

  @override
  Future<void> begin(LocalExchangeRecord record) {
    final now = _now();
    return _db
        .into(_db.localExchange)
        .insertOnConflictUpdate(
          LocalExchangeCompanion.insert(
            clientTransactionId: record.clientTransactionId,
            createIdempotencyKey: record.createIdempotencyKey,
            deviceId: record.deviceId,
            serverExchangeId: Value(record.serverExchangeId),
            exchangeNumber: Value(record.exchangeNumber),
            lastKnownStatus: Value(record.lastKnownState?.wire),
            createdAt: now,
            updatedAt: now,
          ),
        );
  }

  @override
  Future<void> recordServerState(
    String clientTransactionId,
    ExchangeSnapshot exchange, {
    ConfirmationUpdate? confirmation,
  }) => _db.transaction(() async {
    final row = await _row(clientTransactionId);
    if (row == null) return;
    final held = ExchangeState.fromWire(row.lastKnownStatus);
    if (held != null && exchange.state.progressRank < held.progressRank) {
      // A replayed (IDEMPOTENT_SUCCESS) or otherwise older answer: the
      // server never moves an exchange backwards.
      return;
    }
    final now = _now();
    await (_db.update(
      _db.localExchange,
    )..where((t) => t.clientTransactionId.equals(clientTransactionId))).write(
      LocalExchangeCompanion(
        serverExchangeId: Value(exchange.id),
        exchangeNumber: Value(exchange.exchangeNumber),
        lastKnownStatus: Value(exchange.state.wire),
        serverSnapshot: Value(jsonEncode(exchangeToJson(exchange))),
        confirmationStatus: confirmation == null
            ? const Value.absent()
            : Value(confirmation.status?.wire),
        closedAt: exchange.state.isTerminal && row.closedAt == null
            ? Value(now)
            : const Value.absent(),
        updatedAt: Value(now),
      ),
    );
  });

  @override
  Future<void> recordEvidenceState(
    String clientTransactionId,
    ExchangeState state,
  ) async {
    final record = await byId(clientTransactionId);
    final snapshot = record?.serverSnapshot;
    if (snapshot == null) return;
    await recordServerState(
      clientTransactionId,
      snapshot.copyWith(state: state),
    );
  }

  @override
  Future<void> recordConfirmation(
    String clientTransactionId,
    ConfirmationStatus? status,
  ) => _write(
    clientTransactionId,
    LocalExchangeCompanion(confirmationStatus: Value(status?.wire)),
  );

  @override
  Future<void> recordOperator(
    String clientTransactionId,
    OperatorIdentity operator,
  ) => _write(
    clientTransactionId,
    LocalExchangeCompanion(
      operatorEmployeeNumber: Value(operator.employeeNumber),
      operatorName: Value(operator.name),
    ),
  );

  @override
  Future<void> markClosed(String clientTransactionId) => _write(
    clientTransactionId,
    LocalExchangeCompanion(closedAt: Value(_now())),
  );

  @override
  Future<void> reopen(String clientTransactionId) => _write(
    clientTransactionId,
    const LocalExchangeCompanion(closedAt: Value(null)),
  );

  Future<void> _write(String id, LocalExchangeCompanion changes) =>
      (_db.update(_db.localExchange)
            ..where((t) => t.clientTransactionId.equals(id)))
          .write(changes.copyWith(updatedAt: Value(_now())));

  @override
  Future<void> forget(String clientTransactionId) => (_db.delete(
    _db.localExchange,
  )..where((t) => t.clientTransactionId.equals(clientTransactionId))).go();

  @override
  Future<void> markSyncConfirmed(Iterable<String> ids, DateTime at) =>
      (_db.update(_db.localExchange)..where(
            (t) => t.clientTransactionId.isIn(ids) & t.syncConfirmedAt.isNull(),
          ))
          .write(LocalExchangeCompanion(syncConfirmedAt: Value(at)));

  @override
  Future<List<String>> purgeConfirmedBefore(DateTime before) async {
    final expired =
        await (_db.select(_db.localExchange)..where(
              (t) =>
                  t.syncConfirmedAt.isNotNull() &
                  t.syncConfirmedAt.isSmallerThanValue(before),
            ))
            .get();
    final ids = [for (final r in expired) r.clientTransactionId];
    if (ids.isNotEmpty) {
      await (_db.delete(
        _db.localExchange,
      )..where((t) => t.clientTransactionId.isIn(ids))).go();
    }
    return ids;
  }

  static LocalExchangeRecord _toRecord(LocalExchangeRow row) {
    final number = row.operatorEmployeeNumber;
    final name = row.operatorName;
    return LocalExchangeRecord(
      clientTransactionId: row.clientTransactionId,
      createIdempotencyKey: row.createIdempotencyKey,
      deviceId: row.deviceId,
      serverExchangeId: row.serverExchangeId,
      exchangeNumber: row.exchangeNumber,
      lastKnownState: ExchangeState.fromWire(row.lastKnownStatus),
      operator: number != null && name != null
          ? OperatorIdentity(employeeNumber: number, name: name)
          : null,
      serverSnapshot: _snapshot(row.serverSnapshot),
      confirmationStatus: ConfirmationStatus.fromWire(row.confirmationStatus),
      createdAt: row.createdAt,
      closedAt: row.closedAt,
      syncConfirmedAt: row.syncConfirmedAt,
    );
  }

  static ExchangeSnapshot? _snapshot(String? json) {
    if (json == null) return null;
    try {
      return parseExchange(jsonDecode(json));
    } on FormatException catch (e) {
      AppLogger.warning('exchange', 'unreadable local snapshot: $e');
      return null;
    } on TypeError catch (e) {
      AppLogger.warning('exchange', 'unreadable local snapshot: $e');
      return null;
    }
  }
}
