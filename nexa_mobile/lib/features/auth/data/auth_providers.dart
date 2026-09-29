import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/core/storage/storage_providers.dart';
import 'package:nexa_mobile/features/auth/data/auth_remote_data_source.dart';
import 'package:nexa_mobile/features/auth/data/auth_repository_impl.dart';
import 'package:nexa_mobile/features/auth/data/user_session_local_data_source.dart';
import 'package:nexa_mobile/features/auth/domain/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(
    remote: AuthRemoteDataSource(ref.watch(apiClientProvider)),
    local: UserSessionLocalDataSource(ref.watch(appDatabaseProvider)),
    tokenStore: ref.watch(sessionTokenStoreProvider),
  ),
);
