import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/rfid/data/keyboard_wedge_rfid_reader.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_debouncer.dart';
import 'package:nexa_mobile/features/rfid/domain/rfid_reader.dart';

KeyDownEvent _key(String character) => KeyDownEvent(
  physicalKey: PhysicalKeyboardKey.keyA,
  logicalKey: LogicalKeyboardKey.keyA,
  character: character,
  timeStamp: Duration.zero,
);

const _enter = KeyDownEvent(
  physicalKey: PhysicalKeyboardKey.enter,
  logicalKey: LogicalKeyboardKey.enter,
  timeStamp: Duration.zero,
);

void main() {
  group('RfidDebouncer (Doc 13 §7)', () {
    late DateTime now;
    late RfidDebouncer debouncer;

    setUp(() {
      now = DateTime(2026, 9, 25, 8);
      debouncer = RfidDebouncer(
        window: const Duration(milliseconds: 1000),
        now: () => now,
      );
    });

    test('same UID inside the window is a duplicate read', () {
      expect(debouncer.accept('A'), isTrue);
      now = now.add(const Duration(milliseconds: 400));
      expect(debouncer.accept('A'), isFalse);
    });

    test('a held card keeps extending the window', () {
      expect(debouncer.accept('A'), isTrue);
      for (var i = 0; i < 5; i++) {
        now = now.add(const Duration(milliseconds: 800));
        expect(debouncer.accept('A'), isFalse);
      }
      now = now.add(const Duration(milliseconds: 1001));
      expect(debouncer.accept('A'), isTrue);
    });

    test('a different UID always passes', () {
      expect(debouncer.accept('A'), isTrue);
      expect(debouncer.accept('B'), isTrue);
      expect(debouncer.accept('A'), isTrue);
    });

    test('reset forgets the last read', () {
      expect(debouncer.accept('A'), isTrue);
      debouncer.reset();
      expect(debouncer.accept('A'), isTrue);
    });

    test('normalizeRfidUid trims whitespace/control chars, keeps case', () {
      expect(normalizeRfidUid('  AbC123\r\n'), 'AbC123');
      expect(normalizeRfidUid('\t \n'), isNull);
      expect(normalizeRfidUid(''), isNull);
    });
  });

  group('KeyboardWedgeRfidReader (manual / keyboard-wedge, v1)', () {
    late DateTime now;
    late KeyboardWedgeRfidReader reader;
    late List<String> cards;

    setUp(() async {
      now = DateTime(2026, 9, 25, 8);
      reader = KeyboardWedgeRfidReader(
        debounce: const Duration(milliseconds: 1000),
        now: () => now,
      );
      cards = [];
      reader.cardStream().listen(cards.add);
    });

    tearDown(() => reader.dispose());

    test('implements the Doc 13 §6 interface and manual input', () {
      expect(reader, isA<RfidReader>());
      expect(reader, isA<ManualUidInput>());
    });

    test('manual submit is normalised and debounced', () async {
      reader
        ..submit('  CARD-001 ')
        ..submit('CARD-001')
        ..submit('   ');
      await Future<void>.delayed(Duration.zero);
      expect(cards, ['CARD-001']);
    });

    test('wedge keystrokes + Enter emit one UID', () async {
      for (final c in 'CARD-9'.split('')) {
        expect(
          reader.handleKeyEvent(_key(c)),
          isFalse,
          reason: 'keys are never swallowed',
        );
      }
      reader.handleKeyEvent(_enter);
      await Future<void>.delayed(Duration.zero);
      expect(cards, ['CARD-9']);
    });

    test(
      'a pause longer than the inter-key timeout drops a half UID',
      () async {
        reader.handleKeyEvent(_key('X'));
        now = now.add(const Duration(seconds: 2));
        for (final c in 'CARD-7'.split('')) {
          reader.handleKeyEvent(_key(c));
        }
        reader.handleKeyEvent(_enter);
        await Future<void>.delayed(Duration.zero);
        expect(cards, ['CARD-7']);
      },
    );

    test(
      'the same card typed by the wedge and the manual field counts once',
      () async {
        for (final c in 'CARD-5'.split('')) {
          reader.handleKeyEvent(_key(c));
        }
        reader
          ..handleKeyEvent(_enter)
          ..submit('CARD-5');
        await Future<void>.delayed(Duration.zero);
        expect(cards, ['CARD-5']);
      },
    );

    testWidgets('initialize listens to the real hardware keyboard; dispose '
        'stops listening', (tester) async {
      final own = KeyboardWedgeRfidReader(
        debounce: const Duration(milliseconds: 500),
      );
      final got = <String>[];
      own.cardStream().listen(got.add);
      await own.initialize();
      await tester.pumpWidget(const SizedBox());

      await tester.sendKeyEvent(LogicalKeyboardKey.digit4, character: '4');
      await tester.sendKeyEvent(LogicalKeyboardKey.digit2, character: '2');
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(got, ['42']);

      await own.dispose();
      await tester.sendKeyEvent(LogicalKeyboardKey.digit7, character: '7');
      await tester.sendKeyEvent(LogicalKeyboardKey.enter);
      await tester.pump();
      expect(got, ['42']);
    });
  });
}
