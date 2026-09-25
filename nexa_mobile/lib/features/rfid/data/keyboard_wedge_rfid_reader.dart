import 'dart:async';

import 'package:flutter/services.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_debouncer.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_reader.dart';

/// [RfidReader] for v1 (decided 2026-09-25, `nexa_mobile/CLAUDE.md` §2): no
/// hardware SDK, two input paths into one debounced stream —
///
/// - **keyboard wedge**: many USB RFID readers enumerate as a keyboard and
///   "type" the UID followed by Enter. While [initialize]d, hardware key
///   events are collected into a buffer that is emitted on Enter; a pause
///   longer than [interKeyTimeout] discards a half-typed buffer.
/// - **manual entry** ([ManualUidInput.submit]): the PIC types the UID.
///
/// A hardware-specific adapter (USB/Serial, Bluetooth, vendor SDK — Doc 13
/// §5) replaces this class later behind the same interface. Real reader
/// behaviour can only be validated on the physical tablet (Doc 07 §58).
class KeyboardWedgeRfidReader implements RfidReader, ManualUidInput {
  KeyboardWedgeRfidReader({
    required Duration debounce,
    this.interKeyTimeout = const Duration(milliseconds: 800),
    this._keyboard,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now,
       _debouncer = RfidDebouncer(window: debounce, now: now);

  final Duration interKeyTimeout;
  final HardwareKeyboard? _keyboard;
  final DateTime Function() _now;
  final RfidDebouncer _debouncer;
  final _cards = StreamController<String>.broadcast();
  final _buffer = StringBuffer();
  DateTime? _lastKeyAt;
  bool _listening = false;

  HardwareKeyboard get _hardware => _keyboard ?? HardwareKeyboard.instance;

  @override
  Future<void> initialize() async {
    if (_listening) return;
    _hardware.addHandler(handleKeyEvent);
    _listening = true;
  }

  @override
  Stream<String> cardStream() => _cards.stream;

  @override
  void submit(String rawUid) {
    final uid = normalizeRfidUid(rawUid);
    if (uid == null || _cards.isClosed) return;
    if (_debouncer.accept(uid)) _cards.add(uid);
  }

  /// Hardware keyboard handler. Returns `false` so focused text fields still
  /// receive the keys (a UID typed into the manual field and read here too is
  /// deduplicated by the debounce).
  bool handleKeyEvent(KeyEvent event) {
    if (event is! KeyDownEvent) return false;
    final now = _now();
    final last = _lastKeyAt;
    if (last != null && now.difference(last) > interKeyTimeout) {
      _buffer.clear();
    }
    _lastKeyAt = now;

    final key = event.logicalKey;
    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.numpadEnter) {
      final value = _buffer.toString();
      _buffer.clear();
      submit(value);
      return false;
    }
    final character = event.character;
    if (character != null && character.isNotEmpty) {
      _buffer.write(character);
    }
    return false;
  }

  @override
  Future<void> dispose() async {
    if (_listening) {
      _hardware.removeHandler(handleKeyEvent);
      _listening = false;
    }
    await _cards.close();
  }
}
