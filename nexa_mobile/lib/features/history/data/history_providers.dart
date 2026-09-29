import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/history/data/history_remote_data_source.dart';
import 'package:nexa_mobile/features/history/data/history_repository_impl.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_providers.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';

final _historyRemoteProvider = Provider<HistoryRemoteDataSource>(
  (ref) => HistoryRemoteDataSource(ref.watch(apiClientProvider)),
);

final historyRepositoryProvider = Provider<HistoryRepository>(
  (ref) => HistoryRepositoryImpl(ref.watch(_historyRemoteProvider)),
);

/// Today's exchange count for the Home "Riwayat" card. Keyed by device id so
/// `autoDispose` never reuses a count from a previous device binding.
final todayExchangeCountProvider = FutureProvider.autoDispose
    .family<TodayExchangeCountOutcome, String>((ref, deviceId) {
      final offset = ref.watch(serverClockProvider);
      final today = DateTime.now().add(offset);
      return ref
          .watch(historyRepositoryProvider)
          .todayExchangeCount(deviceId: deviceId, today: today);
    });

/// The cached bootstrap catalogue the history shows names from and filters
/// on (needle types, exchange types). Only ACTIVE rows are cached, so a type
/// deactivated since shows its id/code instead of a name.
final class HistoryCatalog {
  const HistoryCatalog({
    this.needleTypes = const [],
    this.exchangeTypes = const [],
  });

  final List<NeedleType> needleTypes;
  final List<ExchangeType> exchangeTypes;

  NeedleType? needle(String? id) {
    if (id == null) return null;
    for (final n in needleTypes) {
      if (n.id == id) return n;
    }
    return null;
  }

  ExchangeType? exchangeType(String? id) {
    if (id == null) return null;
    for (final t in exchangeTypes) {
      if (t.id == id) return t;
    }
    return null;
  }
}

final historyCatalogProvider = FutureProvider.autoDispose<HistoryCatalog>((
  ref,
) async {
  final masterData = ref.watch(masterDataRepositoryProvider);
  return HistoryCatalog(
    needleTypes: await masterData.needleTypes(),
    exchangeTypes: await masterData.exchangeTypes(),
  );
});
