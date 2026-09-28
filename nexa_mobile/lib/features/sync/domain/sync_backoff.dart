/// The technical-failure retry schedule (Doc 15 §14, decided 2026-09-28 in
/// nexa_mobile/CLAUDE.md §2 "Sync retry"): immediately, then after 5 s,
/// 15 s, 30 s and 1 min, then every 5 min while online — no hard cap. Only
/// technical failures follow it; a business rejection is never retried
/// automatically.
abstract final class SyncBackoff {
  static const schedule = [
    Duration.zero,
    Duration(seconds: 5),
    Duration(seconds: 15),
    Duration(seconds: 30),
    Duration(minutes: 1),
  ];

  static const steadyState = Duration(minutes: 5);

  /// Wait before the next automatic try, after [failures] technical failures
  /// in a row (1 = the first failure → retry immediately).
  static Duration delayAfter(int failures) {
    if (failures <= 0) return Duration.zero;
    if (failures <= schedule.length) return schedule[failures - 1];
    return steadyState;
  }
}
