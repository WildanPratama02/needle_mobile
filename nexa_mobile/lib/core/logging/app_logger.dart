import 'dart:developer' as developer;

/// Minimal structured logging (Doc 07 §49, `Flutter_rules/rules.md` §Logging).
///
/// Callers pass codes, request ids and statuses — never a password, a token or
/// a full response body.
abstract final class AppLogger {
  static void info(String name, String message) =>
      developer.log(message, name: 'nexa.$name', level: 800);

  static void warning(String name, String message) =>
      developer.log(message, name: 'nexa.$name', level: 900);

  static void error(
    String name,
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) => developer.log(
    message,
    name: 'nexa.$name',
    level: 1000,
    error: error,
    stackTrace: stackTrace,
  );
}
