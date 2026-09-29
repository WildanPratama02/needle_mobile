import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/features/master_data/data/master_data_repository_impl.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data.dart';
import 'package:nexa_mobile/features/master_data/domain/master_data_repository.dart';

final masterDataRepositoryProvider = Provider<MasterDataRepository>(
  (ref) => MasterDataRepositoryImpl(ref.watch(appDatabaseProvider)),
);

/// The cached exchange types (`BROKEN`, `BENT`, `CHANGEOVER`) — used e.g. by
/// the Home "PENUKARAN HARI INI" card for its row labels.
final exchangeTypesProvider = FutureProvider.autoDispose<List<ExchangeType>>(
  (ref) => ref.watch(masterDataRepositoryProvider).exchangeTypes(),
);
