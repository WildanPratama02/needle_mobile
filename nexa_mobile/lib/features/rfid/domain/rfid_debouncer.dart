/// Doc 13 §7: "same UID + short interval = ignore duplicate read". A card
/// held against the reader is read repeatedly; only the first read in each
/// [window] counts. A different UID always passes.
///
/// Pure (the clock is injected) so the rule is unit-tested on its own.
class RfidDebouncer {
  RfidDebouncer({required this.window, DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final Duration window;
  final DateTime Function() _now;

  String? _lastUid;
  DateTime? _lastAt;

  /// `true` when [uid] should be emitted.
  bool accept(String uid) {
    final now = _now();
    final lastAt = _lastAt;
    final duplicate =
        uid == _lastUid && lastAt != null && now.difference(lastAt) < window;
    // A held card keeps extending the window, so it never re-fires while it
    // stays on the reader.
    _lastUid = uid;
    _lastAt = now;
    return !duplicate;
  }

  void reset() {
    _lastUid = null;
    _lastAt = null;
  }
}

/// Normalises a raw read: trims whitespace and control characters a
/// keyboard-wedge reader may append. Returns `null` for an empty read. The
/// UID's case is kept — the backend compares it as stored.
String? normalizeRfidUid(String raw) {
  final value = raw.replaceAll(RegExp(r'[\x00-\x1F\x7F]'), '').trim();
  return value.isEmpty ? null : value;
}
