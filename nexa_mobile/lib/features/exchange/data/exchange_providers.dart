import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/exchange/data/active_exchange_store_impl.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_remote_data_source.dart';
import 'package:nexa_mobile/features/exchange/data/exchange_repository_impl.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange_repository.dart';

final exchangeRepositoryProvider = Provider<ExchangeRepository>(
  (ref) => ExchangeRepositoryImpl(
    ExchangeRemoteDataSource(ref.watch(apiClientProvider)),
    ref.watch(retryPolicyProvider),
  ),
);

final activeExchangeStoreProvider = Provider<ActiveExchangeStore>(
  (ref) => ActiveExchangeStoreImpl(ref.watch(appDatabaseProvider)),
);

/// How often the "waiting for approval" screen re-reads the confirmation.
final confirmationPollIntervalProvider = Provider<Duration>(
  (ref) => const Duration(seconds: 10),
);
