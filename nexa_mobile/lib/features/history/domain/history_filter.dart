import 'package:nexa_mobile/features/exchange/domain/exchange.dart';

/// Which needle of the exchange a needle-type filter applies to. The backend
/// has separate `oldNeedleTypeId` / `newNeedleTypeId` filters and no "either"
/// (Docs/12 §10, MG-5), so the PIC picks one; the old needle is the default —
/// it is known from the first step of every exchange.
enum NeedleRole { oldNeedle, newNeedle }

/// A span of whole calendar days in the tablet's local time, both ends
/// included (the date-range picker's meaning).
final class HistoryDateRange {
  const HistoryDateRange({required this.start, required this.end});

  final DateTime start;
  final DateTime end;

  @override
  bool operator ==(Object other) =>
      other is HistoryDateRange && other.start == start && other.end == end;

  @override
  int get hashCode => Object.hash(start, end);
}

/// The history filters of FR-MOB-014: Today (default), date range, status,
/// needle type, exchange type. Device scoping is not a filter — it is always
/// applied (the tablet's own history, Docs/12 §10 `deviceId`).
final class HistoryFilter {
  const HistoryFilter({
    this.range,
    this.status,
    this.exchangeTypeId,
    this.needleTypeId,
    this.needleRole = NeedleRole.oldNeedle,
  });

  /// `null` = today.
  final HistoryDateRange? range;

  /// Server Exchange State; `null` = every state.
  final ExchangeState? status;
  final String? exchangeTypeId;
  final String? needleTypeId;
  final NeedleRole needleRole;

  bool get isDefault =>
      range == null &&
      status == null &&
      exchangeTypeId == null &&
      needleTypeId == null;

  HistoryFilter copyWith({
    HistoryDateRange? range,
    bool today = false,
    ExchangeState? status,
    bool anyStatus = false,
    String? exchangeTypeId,
    bool anyExchangeType = false,
    String? needleTypeId,
    bool anyNeedleType = false,
    NeedleRole? needleRole,
  }) => HistoryFilter(
    range: today ? null : (range ?? this.range),
    status: anyStatus ? null : (status ?? this.status),
    exchangeTypeId: anyExchangeType
        ? null
        : (exchangeTypeId ?? this.exchangeTypeId),
    needleTypeId: anyNeedleType ? null : (needleTypeId ?? this.needleTypeId),
    needleRole: needleRole ?? this.needleRole,
  );

  @override
  bool operator ==(Object other) =>
      other is HistoryFilter &&
      other.range == range &&
      other.status == status &&
      other.exchangeTypeId == exchangeTypeId &&
      other.needleTypeId == needleTypeId &&
      other.needleRole == needleRole;

  @override
  int get hashCode =>
      Object.hash(range, status, exchangeTypeId, needleTypeId, needleRole);
}

/// The `[from, to)` instant window of a filter: local midnights, so "today"
/// and a picked day mean the PIC's calendar day, not a UTC one.
final class HistoryWindow {
  const HistoryWindow({required this.from, required this.to});

  /// Inclusive.
  final DateTime from;

  /// Exclusive.
  final DateTime to;

  bool contains(DateTime at) => !at.isBefore(from) && at.isBefore(to);
}

/// Local midnight of [now]'s day to the next local midnight (today), or the
/// first local midnight of the range's start day to the local midnight
/// after its end day. Built with calendar arithmetic, so a DST change never
/// shifts a boundary.
HistoryWindow historyWindow(HistoryFilter filter, DateTime now) {
  final range = filter.range;
  final first = range?.start ?? now;
  final last = range?.end ?? now;
  return HistoryWindow(
    from: DateTime(first.year, first.month, first.day),
    to: DateTime(last.year, last.month, last.day + 1),
  );
}

/// Default page size of the history list (backend maximum is 100).
const historyPageSize = 25;

/// Query parameters of `GET /exchanges` (Docs/12 §10) for one history page:
/// always this device; `dateFrom` inclusive / `dateTo` exclusive as UTC
/// ISO-8601 instants — an offset-less local string would be read in the
/// server's own time zone.
Map<String, Object?> historyQueryParams({
  required String deviceId,
  required HistoryFilter filter,
  required HistoryWindow window,
  required int page,
  int pageSize = historyPageSize,
}) {
  final needleParam = switch (filter.needleRole) {
    NeedleRole.oldNeedle => 'oldNeedleTypeId',
    NeedleRole.newNeedle => 'newNeedleTypeId',
  };
  return {
    'deviceId': deviceId,
    'dateFrom': window.from.toUtc().toIso8601String(),
    'dateTo': window.to.toUtc().toIso8601String(),
    'status': ?filter.status?.wire,
    'exchangeTypeId': ?filter.exchangeTypeId,
    needleParam: ?filter.needleTypeId,
    'page': page,
    'pageSize': pageSize,
  };
}
