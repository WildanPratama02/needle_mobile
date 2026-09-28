import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/history/domain/history_filter.dart';

import '../../../helpers/fixtures.dart';

/// `GET /exchanges` query building for the history list (FR-MOB-014,
/// Docs/12 §10): device scoping, local-calendar date windows sent as UTC
/// instants, and one parameter per filter.
void main() {
  final now = DateTime(2026, 9, 25, 14, 30);

  Map<String, Object?> params(HistoryFilter filter, {int page = 1}) =>
      historyQueryParams(
        deviceId: deviceId,
        filter: filter,
        window: historyWindow(filter, now),
        page: page,
      );

  group('window', () {
    test('Today = local midnight to the next local midnight', () {
      final w = historyWindow(const HistoryFilter(), now);
      expect(w.from, DateTime(2026, 9, 25));
      expect(w.to, DateTime(2026, 9, 26));
      expect(w.contains(DateTime(2026, 9, 25)), isTrue, reason: 'inclusive');
      expect(w.contains(DateTime(2026, 9, 25, 23, 59)), isTrue);
      expect(w.contains(DateTime(2026, 9, 26)), isFalse, reason: 'exclusive');
      expect(w.contains(DateTime(2026, 9, 24, 23, 59)), isFalse);
    });

    test('a range includes its last day: to = the midnight after it, even '
        'across a month end', () {
      final filter = HistoryFilter(
        range: HistoryDateRange(
          start: DateTime(2026, 9, 28, 17),
          end: DateTime(2026, 9, 30, 9),
        ),
      );
      final w = historyWindow(filter, now);
      expect(w.from, DateTime(2026, 9, 28));
      expect(w.to, DateTime(2026, 10));
    });

    test('a one-day range equals that day', () {
      final day = DateTime(2026, 9, 20);
      final w = historyWindow(
        HistoryFilter(
          range: HistoryDateRange(start: day, end: day),
        ),
        now,
      );
      expect(w.from, DateTime(2026, 9, 20));
      expect(w.to, DateTime(2026, 9, 21));
    });
  });

  group('params', () {
    test('default: this device, today as UTC instants, page 1 of 25, no '
        'other filter', () {
      final p = params(const HistoryFilter());
      expect(p, {
        'deviceId': deviceId,
        'dateFrom': DateTime(2026, 9, 25).toUtc().toIso8601String(),
        'dateTo': DateTime(2026, 9, 26).toUtc().toIso8601String(),
        'page': 1,
        'pageSize': historyPageSize,
      });
    });

    test('date bounds are UTC with a Z — never an offset-less local string '
        'the server would read in its own time zone', () {
      final p = params(const HistoryFilter());
      final from = p['dateFrom']! as String;
      final to = p['dateTo']! as String;
      expect(from, endsWith('Z'));
      expect(to, endsWith('Z'));
      expect(DateTime.parse(from).toLocal(), DateTime(2026, 9, 25));
      expect(DateTime.parse(to).toLocal(), DateTime(2026, 9, 26));
    });

    test('status → status (wire value)', () {
      expect(
        params(
          const HistoryFilter(status: ExchangeState.confirmationPending),
        )['status'],
        'CONFIRMATION_PENDING',
      );
    });

    test('exchange type → exchangeTypeId', () {
      expect(
        params(
          const HistoryFilter(exchangeTypeId: 'et-bent'),
        )['exchangeTypeId'],
        'et-bent',
      );
    });

    test('needle type on the old needle → oldNeedleTypeId only', () {
      final p = params(const HistoryFilter(needleTypeId: 'nt-1'));
      expect(p['oldNeedleTypeId'], 'nt-1');
      expect(p.containsKey('newNeedleTypeId'), isFalse);
    });

    test('needle type on the new needle → newNeedleTypeId only', () {
      final p = params(
        const HistoryFilter(
          needleTypeId: 'nt-2',
          needleRole: NeedleRole.newNeedle,
        ),
      );
      expect(p['newNeedleTypeId'], 'nt-2');
      expect(p.containsKey('oldNeedleTypeId'), isFalse);
    });

    test('the role alone (no needle chosen) sends nothing', () {
      final p = params(const HistoryFilter(needleRole: NeedleRole.newNeedle));
      expect(p.containsKey('newNeedleTypeId'), isFalse);
      expect(p.containsKey('oldNeedleTypeId'), isFalse);
    });

    test('every filter together, range + later page; device always kept', () {
      final filter = HistoryFilter(
        range: HistoryDateRange(
          start: DateTime(2026, 9, 1),
          end: DateTime(2026, 9, 7),
        ),
        status: ExchangeState.completed,
        exchangeTypeId: 'et-broken',
        needleTypeId: 'nt-1',
      );
      final p = params(filter, page: 3);
      expect(p['deviceId'], deviceId);
      expect(p['dateFrom'], DateTime(2026, 9).toUtc().toIso8601String());
      expect(p['dateTo'], DateTime(2026, 9, 8).toUtc().toIso8601String());
      expect(p['status'], 'COMPLETED');
      expect(p['exchangeTypeId'], 'et-broken');
      expect(p['oldNeedleTypeId'], 'nt-1');
      expect(p['page'], 3);
    });
  });

  group('HistoryFilter', () {
    test('copyWith clears each filter explicitly; reset is the default', () {
      final f = HistoryFilter(
        range: HistoryDateRange(
          start: DateTime(2026, 9, 1),
          end: DateTime(2026, 9, 2),
        ),
        status: ExchangeState.completed,
        exchangeTypeId: 'et-1',
        needleTypeId: 'nt-1',
      );
      expect(f.isDefault, isFalse);
      expect(f.copyWith(today: true).range, isNull);
      expect(f.copyWith(anyStatus: true).status, isNull);
      expect(f.copyWith(anyExchangeType: true).exchangeTypeId, isNull);
      expect(f.copyWith(anyNeedleType: true).needleTypeId, isNull);
      expect(
        f
            .copyWith(
              today: true,
              anyStatus: true,
              anyExchangeType: true,
              anyNeedleType: true,
            )
            .isDefault,
        isTrue,
      );
      expect(f.copyWith(), f, reason: 'value equality');
    });
  });
}
