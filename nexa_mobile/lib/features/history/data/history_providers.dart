import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/clock/server_clock.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/history/data/history_remote_data_source.dart';
import 'package:nexa_mobile/features/history/data/history_repository_impl.dart';
import 'package:nexa_mobile/features/history/domain/history_repository.dart';

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
