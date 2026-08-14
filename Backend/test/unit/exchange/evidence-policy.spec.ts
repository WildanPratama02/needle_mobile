import { EvidenceType, FragmentStatus } from '@prisma/client';

import {
  isEvidenceComplete,
  missingEvidenceTypes,
  requiredEvidenceTypes,
} from '../../../src/modules/exchange/services/evidence-policy';

const { OLD_NEEDLE, BROKEN_FRAGMENT, OTHER } = EvidenceType;

describe('requiredEvidenceTypes', () => {
  // Round 4 Q9: OLD_NEEDLE always; BROKEN_FRAGMENT only when the fragment was
  // recovered; OTHER never mandatory.
  it('requires only OLD_NEEDLE when no fragment status was recorded', () => {
    expect(requiredEvidenceTypes(null)).toEqual([OLD_NEEDLE]);
  });

  it('requires the fragment photo when the fragment was FOUND', () => {
    expect(requiredEvidenceTypes(FragmentStatus.FOUND)).toEqual([OLD_NEEDLE, BROKEN_FRAGMENT]);
  });

  // Nothing to photograph when the fragment was never recovered.
  it('does not require a fragment photo when it was NOT_FOUND', () => {
    expect(requiredEvidenceTypes(FragmentStatus.NOT_FOUND)).toEqual([OLD_NEEDLE]);
  });

  it('never makes OTHER mandatory', () => {
    for (const status of [null, FragmentStatus.FOUND, FragmentStatus.NOT_FOUND]) {
      expect(requiredEvidenceTypes(status)).not.toContain(OTHER);
    }
  });
});

describe('missingEvidenceTypes', () => {
  it('reports OLD_NEEDLE outstanding when nothing was uploaded', () => {
    expect(missingEvidenceTypes(null, [])).toEqual([OLD_NEEDLE]);
  });

  it('clears once the mandatory type is present', () => {
    expect(missingEvidenceTypes(null, [OLD_NEEDLE])).toEqual([]);
  });

  it('still wants the fragment photo when only the needle was uploaded', () => {
    expect(missingEvidenceTypes(FragmentStatus.FOUND, [OLD_NEEDLE])).toEqual([BROKEN_FRAGMENT]);
  });

  it('ignores OTHER when deciding what is outstanding', () => {
    expect(missingEvidenceTypes(null, [OTHER])).toEqual([OLD_NEEDLE]);
  });

  it('tolerates duplicate uploads of the same type', () => {
    expect(missingEvidenceTypes(null, [OLD_NEEDLE, OLD_NEEDLE])).toEqual([]);
  });
});

describe('isEvidenceComplete', () => {
  it.each([
    [null, [OLD_NEEDLE], true],
    [null, [], false],
    [null, [OTHER], false],
    [FragmentStatus.NOT_FOUND, [OLD_NEEDLE], true],
    [FragmentStatus.FOUND, [OLD_NEEDLE], false],
    [FragmentStatus.FOUND, [OLD_NEEDLE, BROKEN_FRAGMENT], true],
    [FragmentStatus.FOUND, [BROKEN_FRAGMENT], false],
  ])('fragment %s with %p -> %s', (status, uploaded, expected) => {
    expect(isEvidenceComplete(status, uploaded as EvidenceType[])).toBe(expected);
  });

  it('stays complete when an optional OTHER is added afterwards', () => {
    expect(isEvidenceComplete(null, [OLD_NEEDLE, OTHER])).toBe(true);
  });
});
