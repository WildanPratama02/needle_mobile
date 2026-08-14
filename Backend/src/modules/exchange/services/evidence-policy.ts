import { EvidenceType, FragmentStatus } from '@prisma/client';

/**
 * Which evidence an exchange must carry before it can reach
 * `EVIDENCE_CAPTURED` (round 4 Q9).
 *
 * - `OLD_NEEDLE` is always mandatory.
 * - `BROKEN_FRAGMENT` is mandatory only when Fragment Status is `FOUND` —
 *   there is nothing to photograph when the fragment was never recovered, and
 *   `BENT` / `CHANGEOVER` never record a fragment status at all.
 * - `OTHER` is always optional.
 *
 * Pure on purpose: this gates a state transition, so it is unit tested without
 * a database, same as the state machine beside it.
 */
export function requiredEvidenceTypes(fragmentStatus: FragmentStatus | null): EvidenceType[] {
  const required: EvidenceType[] = [EvidenceType.OLD_NEEDLE];

  if (fragmentStatus === FragmentStatus.FOUND) {
    required.push(EvidenceType.BROKEN_FRAGMENT);
  }

  return required;
}

/** The still-missing mandatory types, given what has been uploaded so far. */
export function missingEvidenceTypes(
  fragmentStatus: FragmentStatus | null,
  uploaded: EvidenceType[],
): EvidenceType[] {
  const present = new Set(uploaded);

  return requiredEvidenceTypes(fragmentStatus).filter((type) => !present.has(type));
}

/** True once every mandatory type is present. */
export function isEvidenceComplete(
  fragmentStatus: FragmentStatus | null,
  uploaded: EvidenceType[],
): boolean {
  return missingEvidenceTypes(fragmentStatus, uploaded).length === 0;
}
