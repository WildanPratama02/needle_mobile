import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Sync summary for the Home footer (Doc 07 §8, Doc 15 §19).
///
/// Placeholder until Phase 9: there is no command queue yet, so nothing can be
/// pending. The sync engine replaces this provider with the real counts.
final class SyncOverview {
  const SyncOverview({this.pending = 0, this.failed = 0, this.lastSyncAt});

  final int pending;
  final int failed;
  final DateTime? lastSyncAt;

  bool get allSynced => pending == 0 && failed == 0;
}

final syncOverviewProvider = Provider<SyncOverview>(
  (ref) => const SyncOverview(),
);
