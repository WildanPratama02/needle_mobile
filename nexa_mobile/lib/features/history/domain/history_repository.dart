import 'package:nexa_mobile/core/error/app_error.dart';

sealed class TodayExchangeCountOutcome {
  const TodayExchangeCountOutcome();
}

final class TodayExchangeCountLoaded extends TodayExchangeCountOutcome {
  const TodayExchangeCountLoaded(this.count);

  final int count;
}

final class TodayExchangeCountFailed extends TodayExchangeCountOutcome {
  const TodayExchangeCountFailed(this.error);

  final AppError error;
}

/// `GET /exchanges` (FR-MOB-014, Docs/12), scoped to this device and today.
///
/// Only the total row count is used here (`meta.total` of the paginated
/// list) for the Home "Riwayat" card's "Transaksi hari ini: N" hint. A full
/// transaction-list screen and a per-exchange-type breakdown
/// ("PENUKARAN HARI INI") are out of scope for this repository — the latter
/// has no aggregate-by-type endpoint yet (contract gap, see
/// `Docs/architecture/backend-mobile-contract-matrix.md` row "Transaction
/// list" and `.scratch/mobile-troli-app/issues/`).
abstract interface class HistoryRepository {
  Future<TodayExchangeCountOutcome> todayExchangeCount({
    required String deviceId,
    required DateTime today,
  });
}
