import 'package:nexa_mobile/core/network/api_result.dart';

/// Automatic retry, limited to the Doc 07 §41 whitelist
/// (`NETWORK_TIMEOUT`, `TEMPORARY_SERVER_ERROR` — [AppError.isRetryable]).
///
/// A business rejection (`INVENTORY_INSUFFICIENT_STOCK`,
/// `EXCHANGE_INVALID_STATE`, `RFID_*`, …) is returned on the first answer and
/// never retried (`nexa_mobile/CLAUDE.md` §4).
///
/// The caller must make [run]'s `call` resend the **same** command — for a
/// POST, the same body and the same `Idempotency-Key` — so a retry after a
/// lost response replays the original outcome instead of executing twice
/// (Docs/12 §25).
class RetryPolicy {
  const RetryPolicy({
    this.delays = const [Duration(seconds: 1), Duration(seconds: 3)],
  });

  /// Tests use this so no real time passes.
  const RetryPolicy.immediate({int retries = 2})
    : delays = retries == 2
          ? const [Duration.zero, Duration.zero]
          : const [Duration.zero];

  /// One entry per retry, in order: the first call plus `delays.length`
  /// retries at most.
  final List<Duration> delays;

  Future<ApiResult<T>> run<T>(Future<ApiResult<T>> Function() call) async {
    var result = await call();
    for (final delay in delays) {
      if (result is! ApiFailure<T> || !result.error.isRetryable) return result;
      if (delay > Duration.zero) await Future<void>.delayed(delay);
      result = await call();
    }
    return result;
  }
}
