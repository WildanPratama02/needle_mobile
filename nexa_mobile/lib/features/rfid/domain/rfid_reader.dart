/// RFID reader access, isolated behind the Doc 13 §6 interface
/// (`nexa_mobile/CLAUDE.md` §4). Hardware-specific adapters (USB/Serial,
/// Bluetooth, vendor SDK) live in `data/` and must not leak into the
/// transaction UI. The hardware adapter itself is still TBD
/// (`nexa_mobile/CLAUDE.md` §2); v1 ships the manual / keyboard-wedge reader.
abstract interface class RfidReader {
  Future<void> initialize();

  /// Each distinct card read, already debounced (Doc 13 §7) and trimmed.
  Stream<String> cardStream();

  Future<void> dispose();
}

/// A reader that also accepts a UID typed by hand (manual fallback when the
/// card cannot be read). Presentation shows a text field only when the
/// active reader implements this.
abstract interface class ManualUidInput {
  /// Feeds [rawUid] into the same debounced [RfidReader.cardStream].
  void submit(String rawUid);
}
