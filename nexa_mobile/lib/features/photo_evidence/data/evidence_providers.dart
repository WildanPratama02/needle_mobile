import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:nexa_mobile/core/database/database_provider.dart';
import 'package:nexa_mobile/core/network/network_providers.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_remote_data_source.dart';
import 'package:nexa_mobile/features/photo_evidence/data/evidence_repository_impl.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence_repository.dart';
import 'package:path_provider/path_provider.dart';

/// Where unconfirmed evidence photos live: app-private storage, never the
/// gallery. Overridden in tests with a temp directory.
final evidenceDirectoryProvider = Provider<Future<Directory> Function()>(
  (ref) => () async {
    final docs = await getApplicationDocumentsDirectory();
    return Directory('${docs.path}/evidence')..createSync(recursive: true);
  },
);

final evidenceRepositoryProvider = Provider<EvidenceRepository>(
  (ref) => EvidenceRepositoryImpl(
    db: ref.watch(appDatabaseProvider),
    remote: EvidenceRemoteDataSource(ref.watch(apiClientProvider)),
    retry: ref.watch(retryPolicyProvider),
    directory: ref.watch(evidenceDirectoryProvider),
  ),
);
