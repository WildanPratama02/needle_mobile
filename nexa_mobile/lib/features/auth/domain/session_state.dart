import 'package:nexa_mobile/features/auth/domain/auth_user.dart';

enum SignOutReason {
  /// The user pressed KELUAR.
  userLogout,

  /// The refresh token was refused (Doc 17 §40 "Sesi Anda telah berakhir").
  sessionExpired,

  /// The device id was cleared (re-provisioning or DEVICE_NOT_FOUND); the new
  /// session must be tied to the new device.
  deviceReset,
}

sealed class SessionState {
  const SessionState();
}

/// Reading stored tokens at start-up.
final class SessionRestoring extends SessionState {
  const SessionRestoring();
}

final class SignedOut extends SessionState {
  const SignedOut([this.reason]);

  /// `null` on a cold start without a stored session.
  final SignOutReason? reason;
}

final class SignedIn extends SessionState {
  const SignedIn(this.user);

  final AuthUser user;
}
