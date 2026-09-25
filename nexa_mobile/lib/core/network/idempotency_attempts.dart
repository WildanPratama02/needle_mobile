import 'dart:convert';

import 'package:nexa_mobile/core/error/app_error.dart';
import 'package:uuid/uuid.dart';

/// Chooses the `Idempotency-Key` for each business command (Docs/12 §25,
/// Doc 15 §10, `nexa_mobile/CLAUDE.md` §4).
///
/// An **attempt** is one intent: the same command with the same body. Its key
/// is reused for every resend of that intent — automatic retries and a manual
/// "COBA LAGI" after a network failure — so a lost response replays the
/// original outcome instead of executing twice. A new attempt always gets a
/// new key:
///
/// - after a success (the command happened; a second one is a new intent);
/// - after a business rejection (the backend releases the key of a failed
///   command, and resending the same body later — e.g. once stock is
///   refilled — is a deliberate new try);
/// - when the body differs (same key + different body is
///   `422 IDEMPOTENCY_KEY_REUSED`, a client bug).
///
/// Pure apart from key generation, which is injectable for tests.
class IdempotencyAttempts {
  IdempotencyAttempts({String Function()? newKey})
    : _newKey = newKey ?? const Uuid().v4;

  final String Function() _newKey;
  final Map<String, ({String fingerprint, String key})> _open = {};

  /// The key for sending [command] (e.g. `POST /exchanges/{id}/issue`) with
  /// [body]. Same open attempt → same key; otherwise a fresh one.
  String keyFor(String command, Object? body) {
    final fingerprint = _fingerprint(body);
    final open = _open[command];
    if (open != null && open.fingerprint == fingerprint) return open.key;
    final key = _newKey();
    _open[command] = (fingerprint: fingerprint, key: key);
    return key;
  }

  /// Records the outcome of the last send of [command]. `error == null` means
  /// success. Only a whitelisted transient failure keeps the attempt open.
  void settle(String command, AppError? error) {
    if (error != null && error.isRetryable) return;
    _open.remove(command);
  }

  /// Whether [command] has an attempt that may still be resent as-is.
  bool isOpen(String command) => _open.containsKey(command);

  static String _fingerprint(Object? body) => jsonEncode(_canonical(body));

  /// Key order must not change the fingerprint of an otherwise equal body.
  static Object? _canonical(Object? value) {
    if (value is Map<Object?, Object?>) {
      final entries = value.entries.toList()
        ..sort((a, b) => '${a.key}'.compareTo('${b.key}'));
      return {for (final e in entries) '${e.key}': _canonical(e.value)};
    }
    if (value is List<Object?>) return value.map(_canonical).toList();
    return value;
  }
}
