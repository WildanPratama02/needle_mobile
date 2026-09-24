import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Network reachability as far as the OS knows (Doc 07 §32 ONLINE/OFFLINE).
///
/// "Online" means a network interface is up, not that the backend answers —
/// a failed call still reports `NETWORK_TIMEOUT`. SYNCING / SYNC ERROR come
/// from the sync engine (Phase 9), not from here.
enum ConnectivityStatus { online, offline }

abstract interface class ConnectivitySource {
  Future<ConnectivityStatus> current();
  Stream<ConnectivityStatus> changes();
}

class ConnectivityPlusSource implements ConnectivitySource {
  ConnectivityPlusSource([Connectivity? connectivity])
    : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  static ConnectivityStatus _map(List<ConnectivityResult> results) =>
      results.any((r) => r != ConnectivityResult.none)
      ? ConnectivityStatus.online
      : ConnectivityStatus.offline;

  @override
  Future<ConnectivityStatus> current() async =>
      _map(await _connectivity.checkConnectivity());

  @override
  Stream<ConnectivityStatus> changes() =>
      _connectivity.onConnectivityChanged.map(_map);
}

/// Overridden in tests.
final connectivitySourceProvider = Provider<ConnectivitySource>(
  (ref) => ConnectivityPlusSource(),
);

/// Current status first, then every change.
final connectivityStatusProvider = StreamProvider<ConnectivityStatus>((
  ref,
) async* {
  final source = ref.watch(connectivitySourceProvider);
  yield await source.current();
  yield* source.changes().distinct();
});
