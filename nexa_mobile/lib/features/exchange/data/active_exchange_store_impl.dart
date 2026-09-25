import 'package:drift/drift.dart';
import 'package:nexa_mobile/core/database/app_database.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';

/// `local_exchange` (schema v2). At most one unfinished exchange per tablet:
/// the wizard is linear and resumes that one before opening another.
class ActiveExchangeStoreImpl implements ActiveExchangeStore {
  ActiveExchangeStoreImpl(this._db, {DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final AppDatabase _db;
  final DateTime Function() _now;

  @override
  Future<LocalExchangeRecord?> current(String deviceId) async {
    final rows = await (_db.select(
      _db.localExchange,
    )..orderBy([(t) => OrderingTerm.desc(t.updatedAt)])).get();
    LocalExchangeRecord? found;
    for (final row in rows) {
      if (row.deviceId != deviceId) {
        // Opened from a previous device binding: never resumed here.
        await finish(row.clientTransactionId);
        continue;
      }
      found ??= _toRecord(row);
    }
    return found;
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
    ExchangeSnapshot exchange,
  ) =>
      (_db.update(
        _db.localExchange,
      )..where((t) => t.clientTransactionId.equals(clientTransactionId))).write(
        LocalExchangeCompanion(
          serverExchangeId: Value(exchange.id),
          exchangeNumber: Value(exchange.exchangeNumber),
          lastKnownStatus: Value(exchange.state.wire),
          updatedAt: Value(_now()),
        ),
      );

  @override
  Future<void> recordOperator(
    String clientTransactionId,
    OperatorIdentity operator,
  ) =>
      (_db.update(
        _db.localExchange,
      )..where((t) => t.clientTransactionId.equals(clientTransactionId))).write(
        LocalExchangeCompanion(
          operatorEmployeeNumber: Value(operator.employeeNumber),
          operatorName: Value(operator.name),
          updatedAt: Value(_now()),
        ),
      );

  @override
  Future<void> finish(String clientTransactionId) => (_db.delete(
    _db.localExchange,
  )..where((t) => t.clientTransactionId.equals(clientTransactionId))).go();

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
    );
  }
}
