import 'dart:async';

/// Why a session ended without the user pressing logout.
enum SessionEndReason {
  /// The refresh token was rejected (expired, revoked, or replayed).
  expired,
}

/// Broadcasts session-level events from the HTTP layer to the auth feature,
/// so `core/` does not depend on `features/auth/`.
class SessionEvents {
  final _controller = StreamController<SessionEndReason>.broadcast();

  Stream<SessionEndReason> get stream => _controller.stream;

  void sessionEnded(SessionEndReason reason) => _controller.add(reason);

  Future<void> dispose() => _controller.close();
}
