import 'package:flutter_test/flutter_test.dart';
import 'package:nexa_mobile/features/exchange/domain/exchange.dart';
import 'package:nexa_mobile/features/photo_evidence/domain/evidence.dart';

void main() {
  group('EvidencePolicy mirrors Backend evidence-policy.ts', () {
    test('OLD_NEEDLE is always required', () {
      expect(EvidencePolicy.required(null), [EvidenceType.oldNeedle]);
      expect(EvidencePolicy.required(FragmentStatus.notFound), [
        EvidenceType.oldNeedle,
      ]);
    });

    test('BROKEN_FRAGMENT only when the fragment was FOUND', () {
      expect(EvidencePolicy.required(FragmentStatus.found), [
        EvidenceType.oldNeedle,
        EvidenceType.brokenFragment,
      ]);
    });

    test('missing / complete', () {
      expect(
        EvidencePolicy.missing(FragmentStatus.found, [EvidenceType.oldNeedle]),
        [EvidenceType.brokenFragment],
      );
      expect(
        EvidencePolicy.isComplete(FragmentStatus.found, [
          EvidenceType.brokenFragment,
          EvidenceType.oldNeedle,
        ]),
        isTrue,
      );
      expect(
        EvidencePolicy.isComplete(null, [EvidenceType.other]),
        isFalse,
        reason: 'OTHER is never a substitute',
      );
    });
  });

  group('EvidenceFilePolicy (jpeg/png/webp, max 10 MB)', () {
    test('accepts the three image types up to exactly 10 MB', () {
      for (final mime in ['image/jpeg', 'image/png', 'image/webp']) {
        expect(
          EvidenceFilePolicy.check(
            mimeType: mime,
            byteSize: EvidenceFilePolicy.maxBytes,
          ),
          isNull,
        );
      }
    });

    test('rejects over 10 MB, empty files and other types', () {
      expect(
        EvidenceFilePolicy.check(
          mimeType: 'image/jpeg',
          byteSize: EvidenceFilePolicy.maxBytes + 1,
        ),
        EvidenceFileProblem.tooLarge,
      );
      expect(
        EvidenceFilePolicy.check(mimeType: 'image/jpeg', byteSize: 0),
        EvidenceFileProblem.empty,
      );
      expect(
        EvidenceFilePolicy.check(mimeType: 'image/heic', byteSize: 10),
        EvidenceFileProblem.unsupportedType,
      );
    });

    test('MIME type from the file name', () {
      expect(EvidenceFilePolicy.mimeTypeFor('/a/B.JPG'), 'image/jpeg');
      expect(EvidenceFilePolicy.mimeTypeFor('x.jpeg'), 'image/jpeg');
      expect(EvidenceFilePolicy.mimeTypeFor('x.png'), 'image/png');
      expect(EvidenceFilePolicy.mimeTypeFor('x.webp'), 'image/webp');
      expect(EvidenceFilePolicy.mimeTypeFor('x.heic'), isNull);
    });
  });
}
