import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Server time is authoritative (Doc 15 §18). Keeps `serverTime − deviceTime`
/// from the last heartbeat (`clockOffsetMs`) or bootstrap (`serverTime`).
class ServerClock extends Notifier<Duration> {
  @override
  Duration build() => Duration.zero;

  /// From heartbeat `clockOffsetMs`.
  void setOffset(Duration offset) => state = offset;

  /// From a `serverTime` observed at local time [receivedAt].
  void observe(DateTime serverTime, DateTime receivedAt) =>
      state = serverTime.difference(receivedAt);

  DateTime now() => DateTime.now().add(state);
}

final serverClockProvider = NotifierProvider<ServerClock, Duration>(
  ServerClock.new,
);
