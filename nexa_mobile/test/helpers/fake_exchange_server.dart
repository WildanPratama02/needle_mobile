import 'dart:convert';

import 'package:dio/dio.dart';

import 'fake_backend.dart';
import 'fixtures.dart';

/// Master data with all three exchange types, two needle types and a storage
/// mapping per exchange type — the shape `GET /mobile/bootstrap` really
/// returns for trolley A-01.
Map<String, Object?> exchangeBootstrapData() => {
  ...bootstrapData(),
  'exchangeTypes': [
    {
      'id': 'et-broken',
      'code': 'BROKEN',
      'name': 'Broken Needle',
      'requiresFragmentValidation': true,
    },
    {
      'id': 'et-bent',
      'code': 'BENT',
      'name': 'Bent Needle',
      'requiresFragmentValidation': false,
    },
    {
      'id': 'et-co',
      'code': 'CHANGEOVER',
      'name': 'Changeover',
      'requiresFragmentValidation': false,
    },
  ],
  'needleTypes': [
    {
      'id': 'nt-1',
      'code': 'DBX1-14',
      'name': 'DBx1 #14',
      'category': null,
      'unit': 'PCS',
      'minimumStock': '10.000',
    },
    {
      'id': 'nt-2',
      'code': 'DPX5-14',
      'name': 'DPx5 #14',
      'category': null,
      'unit': 'PCS',
      'minimumStock': '10.000',
    },
  ],
  'storageMappings': [
    {
      'id': 'sm-broken',
      'exchangeTypeId': 'et-broken',
      'storageLocationId': 'loc-broken',
      'storageLocationCode': 'HOLE-BRK',
      'storageLocationName': 'Lubang Jarum Patah',
    },
    {
      'id': 'sm-bent',
      'exchangeTypeId': 'et-bent',
      'storageLocationId': 'loc-bent',
      'storageLocationCode': 'HOLE-BNT',
      'storageLocationName': 'Lubang Jarum Bengkok',
    },
    {
      'id': 'sm-co',
      'exchangeTypeId': 'et-co',
      'storageLocationId': 'loc-co',
      'storageLocationCode': 'HOLE-CO',
      'storageLocationName': 'Lubang Changeover',
    },
  ],
};

const exchangeId = 'exc-1';
const confirmationId = 'cnf-1';
const cardUid = 'CARD-001';

/// A small in-memory backend that follows the real exchange state machine
/// (`exchange-state-machine.ts`, `evidence-policy.ts`) closely enough to
/// drive the wizard end to end — including 409s for out-of-step calls.
class FakeExchangeServer {
  FakeExchangeServer(this.backend, {Map<String, int>? stock})
    : stock = stock ?? {'nt-1': 25, 'nt-2': 0};

  final FakeBackend backend;
  final Map<String, int> stock;
  Map<String, Object?>? exchange;
  String confirmationStatus = 'PENDING';
  String? rejectionReason;
  final List<String> uploadedEvidence = [];
  String? cancelReason;
  int completedCount = 0;

  /// The tablet's key for the exchange (from `POST /exchanges`).
  String? clientTransactionId;

  /// Every command `POST /mobile/sync` received, in order (resends too).
  final List<Map<String, Object?>> syncCommands = [];

  /// Successful results by `commandId` — replayed as `IDEMPOTENT_SUCCESS`
  /// (the backend's idempotency table, Docs/adr/0007).
  final Map<String, Map<String, Object?>> _succeeded = {};

  /// How many times each step really executed (never twice per commandId).
  final Map<String, int> executed = {};

  /// Extra pull pages to announce with `hasMore` (cursor paging tests).
  int extraPullPages = 0;

  /// `changes.masterDataVersions` of every sync answer.
  Map<String, Object?> syncMasterDataVersions = {
    'needleTypes': 'nv1',
    'exchangeTypes': 'ev1',
    'storageMappings': 'sv1',
  };

  /// Returning a response here replaces the whole sync answer (network
  /// failure, 5xx…).
  FakeResponse? Function(RecordedRequest request)? interceptSync;

  /// Command types that answer `FAILED` (technical) while listed.
  final Set<String> failingCommandTypes = {};

  /// Executes the next N sync requests but loses the answer (timeout after
  /// the server committed) — the resend must replay, not execute again.
  int dropSyncAnswers = 0;

  static const _types = {
    'et-broken': ('BROKEN', 'Broken Needle'),
    'et-bent': ('BENT', 'Bent Needle'),
    'et-co': ('CHANGEOVER', 'Changeover'),
  };

  String? get state => exchange?['status'] as String?;

  Map<String, Object?> newExchange({String status = 'CREATED'}) => {
    'id': exchangeId,
    'exchangeNumber': 'EXC-20260925-000001',
    'status': status,
    'factoryId': 'factory-1',
    'trolleyId': 'trolley-1',
    'deviceId': deviceId,
    'operatorId': null,
    'exchangeTypeId': null,
    'exchangeTypeCode': null,
    'exchangeTypeName': null,
    'oldNeedleTypeId': null,
    'newNeedleTypeId': null,
    'fragmentStatus': null,
    'confirmationId': null,
    'createdAt': '2026-09-25T08:00:00.000Z',
    'completedAt': null,
    'cancelledAt': null,
  };

  /// Puts the server at [status] with a BENT exchange (for resume tests).
  void seedBent(String status) {
    exchange = {
      ...newExchange(status: status),
      'operatorId': 'emp-1',
      'exchangeTypeId': 'et-bent',
      'exchangeTypeCode': 'BENT',
      'exchangeTypeName': 'Bent Needle',
      'oldNeedleTypeId': 'nt-1',
    };
  }

  FakeResponse _invalid(String action) => FakeResponse.error(
    409,
    'EXCHANGE_INVALID_STATE',
    context: {'currentState': state, 'action': action},
  );

  FakeResponse _move(
    List<String> from,
    String to,
    String action, [
    Map<String, Object?> changes = const {},
  ]) {
    final current = exchange;
    if (current == null) return FakeResponse.error(404, 'EXCHANGE_NOT_FOUND');
    if (state == 'CONFIRMATION_PENDING' &&
        from.contains('CONFIRMATION_PENDING') &&
        confirmationStatus != 'APPROVED') {
      return FakeResponse.error(
        409,
        'EXCHANGE_FRAGMENT_CONFIRMATION_REQUIRED',
        context: {
          'currentState': state,
          'action': action,
          'confirmationStatus': confirmationStatus,
        },
      );
    }
    if (!from.contains(state)) return _invalid(action);
    exchange = {...current, ...changes, 'status': to};
    return FakeResponse.ok(exchange);
  }

  List<String> get _outstanding {
    final required = [
      'OLD_NEEDLE',
      if (exchange?['fragmentStatus'] == 'FOUND') 'BROKEN_FRAGMENT',
    ];
    return required.where((t) => !uploadedEvidence.contains(t)).toList();
  }

  /// `MobileExchangeDto`: the exchange plus the tablet's key and the
  /// confirmation status (`null` when none was raised, MG-10).
  Map<String, Object?>? get mobileExchange {
    final e = exchange;
    if (e == null) return null;
    return {
      ...e,
      'clientTransactionId': clientTransactionId,
      'confirmationStatus': e['confirmationId'] == null
          ? null
          : confirmationStatus,
    };
  }

  FakeResponse _operator() => _move(
    ['CREATED'],
    'OPERATOR_IDENTIFIED',
    'IDENTIFY_OPERATOR',
    {'operatorId': 'emp-1'},
  );

  FakeResponse _selectType(Map<String, Object?> body) {
    final typeId = body['exchangeTypeId']! as String;
    final type = _types[typeId]!;
    return _move(
      ['OPERATOR_IDENTIFIED'],
      'EXCHANGE_TYPE_SELECTED',
      'SELECT_TYPE',
      {
        'exchangeTypeId': typeId,
        'exchangeTypeCode': type.$1,
        'exchangeTypeName': type.$2,
        'oldNeedleTypeId': body['oldNeedleTypeId'],
      },
    );
  }

  FakeResponse _fragment(Map<String, Object?> body) {
    final status = body['fragmentStatus'];
    if (status == 'NOT_FOUND') {
      confirmationStatus = 'PENDING';
      return _move(
        ['EXCHANGE_TYPE_SELECTED'],
        'CONFIRMATION_PENDING',
        'RECORD_FRAGMENT',
        {'fragmentStatus': 'NOT_FOUND', 'confirmationId': confirmationId},
      );
    }
    return _move(
      ['EXCHANGE_TYPE_SELECTED'],
      'FRAGMENT_CHECK',
      'RECORD_FRAGMENT',
      {'fragmentStatus': 'FOUND'},
    );
  }

  FakeResponse _newNeedle(Map<String, Object?> body) {
    final needle = body['needleTypeId']! as String;
    if (state != 'EVIDENCE_CAPTURED') return _invalid('SELECT_NEW_NEEDLE');
    final available = stock[needle] ?? 0;
    if (available < 1) {
      return FakeResponse.error(
        409,
        'INVENTORY_INSUFFICIENT_STOCK',
        context: {
          'needleTypeId': needle,
          'availableQuantity': available,
          'requestedQuantity': 1,
        },
      );
    }
    return _move(
      ['EVIDENCE_CAPTURED'],
      'NEW_NEEDLE_SELECTED',
      'SELECT_NEW_NEEDLE',
      {'newNeedleTypeId': needle},
    );
  }

  FakeResponse _issue() {
    if (state != 'NEW_NEEDLE_SELECTED') return _invalid('ISSUE_NEEDLE');
    final needle = exchange!['newNeedleTypeId']! as String;
    final available = stock[needle] ?? 0;
    if (available < 1) {
      return FakeResponse.error(
        409,
        'INVENTORY_INSUFFICIENT_STOCK',
        context: {'availableQuantity': available, 'requestedQuantity': 1},
      );
    }
    stock[needle] = available - 1;
    return _move(['NEW_NEEDLE_SELECTED'], 'NEEDLE_ISSUED', 'ISSUE_NEEDLE');
  }

  FakeResponse _store() =>
      _move(['NEEDLE_ISSUED'], 'USED_NEEDLE_STORED', 'STORE_USED_NEEDLE');

  FakeResponse _complete() {
    final moved = _move(
      ['USED_NEEDLE_STORED'],
      'COMPLETED',
      'COMPLETE',
      {'completedAt': '2026-09-25T08:10:00.000Z'},
    );
    if (moved.status == 200) completedCount++;
    return moved;
  }

  FakeResponse _cancel(Map<String, Object?> body) {
    if (exchange == null) return FakeResponse.error(404, 'EXCHANGE_NOT_FOUND');
    if (state == 'COMPLETED' || state == 'CANCELLED') {
      return _invalid('CANCEL');
    }
    cancelReason = body['reason'] as String?;
    if (state == 'NEEDLE_ISSUED' || state == 'USED_NEEDLE_STORED') {
      final needle = exchange!['newNeedleTypeId']! as String;
      stock[needle] = (stock[needle] ?? 0) + 1; // REVERSAL
    }
    exchange = {
      ...exchange!,
      'status': 'CANCELLED',
      'cancelledAt': '2026-09-25T08:09:00.000Z',
    };
    return FakeResponse.ok(exchange);
  }

  FakeResponse _dispatch(String type, Map<String, Object?> payload) =>
      switch (type) {
        'ASSIGN_OPERATOR' => _operator(),
        'SELECT_EXCHANGE_TYPE' => _selectType(payload),
        'FRAGMENT_VALIDATION' => _fragment(payload),
        'SELECT_NEW_NEEDLE' => _newNeedle(payload),
        'ISSUE_NEEDLE' => _issue(),
        'STORE_USED_NEEDLE' => _store(),
        'COMPLETE_EXCHANGE' => _complete(),
        'CANCEL_EXCHANGE' => _cancel(payload),
        _ => FakeResponse.error(400, 'VALIDATION_ERROR'),
      };

  /// The pull cursor encodes what the tablet last saw of the exchange.
  String get _fingerprint =>
      'fp:${jsonEncode(mobileExchange).hashCode}:$confirmationStatus';

  /// `POST /mobile/sync` as `sync.service.ts` runs it: commands in order, one
  /// at a time; a REJECTED/FAILED command halts the rest of its exchange
  /// (SKIPPED); a `commandId` that already succeeded replays; then the pull.
  FakeResponse _sync(RecordedRequest r) {
    final intercepted = interceptSync?.call(r);
    if (intercepted != null) return intercepted;
    final body = r.body! as Map<String, Object?>;
    if (body['deviceId'] != deviceId) {
      return FakeResponse.error(403, 'DEVICE_MISMATCH');
    }
    final halted = <String>{};
    final results = <Map<String, Object?>>[];
    for (final raw in (body['commands']! as List<Object?>)) {
      final command = (raw! as Map).cast<String, Object?>();
      syncCommands.add(command);
      final id = command['commandId']! as String;
      final ctx = command['clientTransactionId']! as String;
      final type = command['commandType']! as String;
      Map<String, Object?> result(
        String status, {
        Map<String, Object?>? error,
      }) => {
        'commandId': id,
        'clientTransactionId': ctx,
        'commandType': type,
        'status': status,
        'referenceId': exchange?['id'],
        'error': ?error,
        'exchange': ctx == clientTransactionId ? mobileExchange : null,
      };
      if (halted.contains(ctx)) {
        results.add(result('SKIPPED'));
        continue;
      }
      final replay = _succeeded[id];
      if (replay != null) {
        results.add({...replay, 'status': 'IDEMPOTENT_SUCCESS'});
        continue;
      }
      if (failingCommandTypes.contains(type)) {
        halted.add(ctx);
        results.add(
          result(
            'FAILED',
            error: {'code': 'INTERNAL_ERROR', 'message': 'boom', 'details': []},
          ),
        );
        continue;
      }
      final FakeResponse answer;
      if (ctx != clientTransactionId || exchange == null) {
        answer = FakeResponse.error(404, 'EXCHANGE_NOT_FOUND');
      } else {
        answer = _dispatch(
          type,
          (command['payload'] as Map?)?.cast<String, Object?>() ?? const {},
        );
      }
      if (answer.status >= 400) {
        halted.add(ctx);
        final error = ((answer.body! as Map)['error']! as Map)
            .cast<String, Object?>();
        results.add(result('REJECTED', error: error));
        continue;
      }
      executed[type] = (executed[type] ?? 0) + 1;
      final ok = result('SUCCESS');
      _succeeded[id] = ok;
      results.add(ok);
    }
    if (dropSyncAnswers > 0) {
      dropSyncAnswers--;
      return const FakeResponse.networkError();
    }
    final cursor = body['cursor'] as String?;
    final changed = mobileExchange != null && cursor != _fingerprint;
    final hasMore = extraPullPages > 0;
    if (hasMore) extraPullPages--;
    return FakeResponse.ok({
      'results': results,
      'changes': {
        'exchanges': [if (changed) mobileExchange],
        'hasMore': hasMore,
        'masterDataVersions': syncMasterDataVersions,
      },
      'nextCursor': hasMore ? 'page-$extraPullPages' : _fingerprint,
      'serverTime': '2026-09-25T08:00:05.000Z',
    });
  }

  void install() {
    backend
      ..on('POST', '/auth/login', (_) => FakeResponse.ok(loginData()))
      ..on('GET', '/auth/me', (_) => FakeResponse.ok(meData()))
      ..on(
        'GET',
        '/mobile/bootstrap',
        (_) => FakeResponse.ok(exchangeBootstrapData()),
      )
      ..on(
        'POST',
        '/devices/$deviceId/heartbeat',
        (_) => FakeResponse.ok(heartbeatData()),
      )
      ..on(
        'GET',
        '/exchanges',
        (_) => FakeResponse(200, {
          'success': true,
          'data': <Object?>[],
          'meta': {'requestId': 'req-1', 'total': completedCount},
        }),
      )
      ..on(
        'GET',
        '/inventory/trolleys/trolley-1',
        (_) => FakeResponse.ok({
          'trolleyId': 'trolley-1',
          'factoryId': 'factory-1',
          'items': [
            for (final e in stock.entries)
              {
                'needleTypeId': e.key,
                'needleTypeCode': e.key == 'nt-1' ? 'DBX1-14' : 'DPX5-14',
                'quantity': e.value,
                'minimumStock': 10,
                'stockStatus': e.value == 0
                    ? 'OUT'
                    : e.value < 10
                    ? 'LOW'
                    : 'NORMAL',
              },
          ],
        }),
      )
      ..on('POST', '/exchanges', (r) {
        exchange ??= newExchange();
        clientTransactionId ??=
            (r.body! as Map<String, Object?>)['clientTransactionId'] as String?;
        return FakeResponse.ok(exchange, status: 201);
      })
      ..on('POST', '/mobile/sync', _sync)
      ..on(
        'GET',
        '/exchanges/$exchangeId',
        (_) => exchange == null
            ? FakeResponse.error(404, 'EXCHANGE_NOT_FOUND')
            : FakeResponse.ok(exchange),
      )
      ..on(
        'GET',
        '/rfid/cards/uid/$cardUid',
        (_) => FakeResponse.ok({
          'employee': {
            'id': 'emp-1',
            'employeeNumber': 'EMP001',
            'name': 'Siti Operator',
            'factoryId': 'factory-1',
            'status': 'ACTIVE',
          },
          'rfidCard': {'id': 'card-1', 'uid': cardUid, 'status': 'ACTIVE'},
        }),
      )
      ..on(
        'GET',
        '/rfid/cards/uid/UNKNOWN',
        (_) => FakeResponse.error(404, 'RFID_NOT_FOUND'),
      )
      ..on('POST', '/exchanges/$exchangeId/operator', (_) => _operator())
      ..on(
        'GET',
        '/confirmations/$confirmationId',
        (_) => FakeResponse.ok({
          'id': confirmationId,
          'confirmationNumber': 'CNF-20260925-000001',
          'exchangeId': exchangeId,
          'exchangeNumber': 'EXC-20260925-000001',
          'exchangeStatus': state,
          'factoryId': 'factory-1',
          'status': confirmationStatus,
          'requestedToUserId': 'approver-1',
          'requestedAt': '2026-09-25T08:05:00.000Z',
          'dueAt': null,
          'decidedAt': null,
          'decisions': [
            if (confirmationStatus == 'REJECTED')
              {
                'id': 'dec-1',
                'decision': 'REJECTED',
                'decidedBy': 'approver-1',
                'reason': rejectionReason,
                'decidedAt': '2026-09-25T08:06:00.000Z',
              },
          ],
        }),
      )
      ..on('POST', '/exchanges/$exchangeId/evidence', (r) {
        const allowed = [
          'EXCHANGE_TYPE_SELECTED',
          'FRAGMENT_CHECK',
          'CONFIRMATION_PENDING',
          'EVIDENCE_CAPTURED',
        ];
        if (!allowed.contains(state)) {
          return FakeResponse.error(409, 'CONFLICT');
        }
        final form = r.body! as FormData;
        final type = form.fields
            .firstWhere((f) => f.key == 'evidenceType')
            .value;
        if (form.files.isEmpty) {
          return FakeResponse.error(400, 'VALIDATION_ERROR');
        }
        uploadedEvidence.add(type);
        if (_outstanding.isEmpty && state != 'EVIDENCE_CAPTURED') {
          final moved = _move(
            [
              'EXCHANGE_TYPE_SELECTED',
              'FRAGMENT_CHECK',
              'CONFIRMATION_PENDING',
            ],
            'EVIDENCE_CAPTURED',
            'CAPTURE_EVIDENCE',
          );
          if (moved.status != 200) return moved;
        }
        return FakeResponse.ok({
          'id': 'ev-${uploadedEvidence.length}',
          'exchangeId': exchangeId,
          'evidenceType': type,
          'status': 'UPLOADED',
          'exchangeStatus': state,
          'outstanding': _outstanding,
        }, status: 201);
      })
      ..on(
        'GET',
        '/exchanges/$exchangeId/evidence',
        (_) => FakeResponse.ok([
          for (final (i, type) in uploadedEvidence.indexed)
            {'id': 'ev-$i', 'evidenceType': type, 'status': 'UPLOADED'},
        ]),
      );
  }
}
