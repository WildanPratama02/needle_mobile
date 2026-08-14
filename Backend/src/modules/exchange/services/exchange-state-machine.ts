import { ConfirmationStatus, ExchangeState, FragmentStatus } from '@prisma/client';

/**
 * The exchange state machine, as pure logic.
 *
 * Kept free of Prisma and Nest so every transition — valid and invalid — can be
 * unit tested without a database. The service layer calls `resolve()` before
 * touching anything; Backend/CLAUDE.md §5 requires transitions to be validated
 * here rather than in a DTO, and forbids skipping steps.
 *
 * Canonical order (CONTEXT.md, Docs/10 §8.2):
 *
 *   CREATED -> OPERATOR_IDENTIFIED -> NEEDLE_SELECTED -> EXCHANGE_TYPE_SELECTED
 *     -> FRAGMENT_CHECK -> [CONFIRMATION_PENDING ->] EVIDENCE_CAPTURED
 *     -> NEW_NEEDLE_SELECTED -> NEEDLE_ISSUED -> USED_NEEDLE_STORED -> COMPLETED
 *
 * FRAGMENT_CHECK and CONFIRMATION_PENDING apply to BROKEN only.
 */

export const BROKEN_EXCHANGE_TYPE = 'BROKEN';

export type ExchangeAction =
  | 'IDENTIFY_OPERATOR'
  | 'SELECT_TYPE'
  | 'RECORD_FRAGMENT'
  | 'CAPTURE_EVIDENCE'
  | 'SELECT_NEW_NEEDLE'
  | 'ISSUE_NEEDLE'
  | 'STORE_USED_NEEDLE'
  | 'COMPLETE'
  | 'CANCEL';

export interface TransitionContext {
  state: ExchangeState;
  /** `BROKEN` / `BENT` / `CHANGEOVER`; null before `/type` has been called. */
  exchangeTypeCode: string | null;
  fragmentStatus: FragmentStatus | null;
  /** Status of this exchange's Confirmation, if one was ever raised. */
  confirmationStatus: ConfirmationStatus | null;
}

/** States from which nothing further can happen. */
export const TERMINAL_STATES: ExchangeState[] = [ExchangeState.COMPLETED, ExchangeState.CANCELLED];

/** Everything else — the states an exchange can still be cancelled from. */
export const NON_TERMINAL_STATES: ExchangeState[] = Object.values(ExchangeState).filter(
  (state) => !TERMINAL_STATES.includes(state),
);

/**
 * States in which the trolley balance has already been decremented, so
 * cancelling owes a reversing stock movement rather than simply stopping
 * (Docs/02 §22-23).
 */
export const POST_ISSUE_STATES: ExchangeState[] = [
  ExchangeState.NEEDLE_ISSUED,
  ExchangeState.USED_NEEDLE_STORED,
];

/** True when cancelling from this state must reverse stock. */
export function requiresStockReversal(state: ExchangeState): boolean {
  return POST_ISSUE_STATES.includes(state);
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly action: ExchangeAction,
    readonly from: ExchangeState,
    reason: string,
  ) {
    super(reason);
    this.name = 'InvalidTransitionError';
  }
}

interface TransitionRule {
  from: ExchangeState[];
  /**
   * Every state written, in order. `/type` and a fragment-not-found check each
   * pass through an intermediate state within a single transaction, so callers
   * persist the whole path and land on the last entry.
   */
  path: (context: TransitionContext) => ExchangeState[];
  /** Returns a rejection reason, or null when the move is allowed. */
  guard?: (context: TransitionContext) => string | null;
}

const RULES: Record<ExchangeAction, TransitionRule> = {
  IDENTIFY_OPERATOR: {
    from: [ExchangeState.CREATED],
    path: () => [ExchangeState.OPERATOR_IDENTIFIED],
  },

  // Round 4 Q5: NEEDLE_SELECTED is transient and has no endpoint of its own —
  // `/type` writes it and EXCHANGE_TYPE_SELECTED inside one transaction.
  SELECT_TYPE: {
    from: [ExchangeState.OPERATOR_IDENTIFIED],
    path: () => [ExchangeState.NEEDLE_SELECTED, ExchangeState.EXCHANGE_TYPE_SELECTED],
  },

  RECORD_FRAGMENT: {
    from: [ExchangeState.EXCHANGE_TYPE_SELECTED],
    guard: (context) =>
      context.exchangeTypeCode === BROKEN_EXCHANGE_TYPE
        ? null
        : `Fragment check applies to ${BROKEN_EXCHANGE_TYPE} exchanges only, not ${
            context.exchangeTypeCode ?? 'an unset type'
          }`,
    // NOT_FOUND passes through FRAGMENT_CHECK and stops at CONFIRMATION_PENDING;
    // a Confirmation is raised there and must be approved before evidence.
    path: (context) =>
      context.fragmentStatus === FragmentStatus.NOT_FOUND
        ? [ExchangeState.FRAGMENT_CHECK, ExchangeState.CONFIRMATION_PENDING]
        : [ExchangeState.FRAGMENT_CHECK],
  },

  CAPTURE_EVIDENCE: {
    from: [
      // BENT / CHANGEOVER skip FRAGMENT_CHECK entirely (round 4 Q6).
      ExchangeState.EXCHANGE_TYPE_SELECTED,
      // BROKEN with the fragment recovered.
      ExchangeState.FRAGMENT_CHECK,
      // BROKEN, fragment missing, confirmation decided.
      ExchangeState.CONFIRMATION_PENDING,
    ],
    guard: (context) => {
      if (
        context.state === ExchangeState.EXCHANGE_TYPE_SELECTED &&
        context.exchangeTypeCode === BROKEN_EXCHANGE_TYPE
      ) {
        return 'A BROKEN exchange must record its fragment status before evidence';
      }

      if (context.state === ExchangeState.CONFIRMATION_PENDING) {
        if (context.confirmationStatus === ConfirmationStatus.APPROVED) {
          return null;
        }

        // Rejected or expired is not a distinct state — the exchange simply
        // stops advancing until someone cancels it (CONTEXT.md).
        return `Confirmation is ${context.confirmationStatus ?? 'missing'}; the exchange cannot advance until it is APPROVED`;
      }

      return null;
    },
    path: () => [ExchangeState.EVIDENCE_CAPTURED],
  },

  SELECT_NEW_NEEDLE: {
    from: [ExchangeState.EVIDENCE_CAPTURED],
    path: () => [ExchangeState.NEW_NEEDLE_SELECTED],
  },

  ISSUE_NEEDLE: {
    from: [ExchangeState.NEW_NEEDLE_SELECTED],
    path: () => [ExchangeState.NEEDLE_ISSUED],
  },

  STORE_USED_NEEDLE: {
    from: [ExchangeState.NEEDLE_ISSUED],
    path: () => [ExchangeState.USED_NEEDLE_STORED],
  },

  COMPLETE: {
    from: [ExchangeState.USED_NEEDLE_STORED],
    path: () => [ExchangeState.COMPLETED],
  },

  /**
   * Allowed from every non-terminal state (spec decision 4), including the
   * stuck ones — a rejected confirmation or a stock-blocked exchange is
   * released precisely by cancelling it.
   *
   * Cancelling after `NEEDLE_ISSUED` is not blocked; the stock is reversed
   * instead (Docs/02 §22-23). `COMPLETED` is excluded by the terminal check in
   * `resolveTransition`, matching Docs/03 UC-MOB-014.
   */
  CANCEL: {
    from: NON_TERMINAL_STATES,
    path: () => [ExchangeState.CANCELLED],
  },
};

/**
 * Validates an action against the current context and returns the states to
 * write, in order. The last element is where the exchange ends up.
 *
 * @throws InvalidTransitionError when the move would skip a step, run from a
 * terminal state, or fail a business guard.
 */
export function resolveTransition(
  action: ExchangeAction,
  context: TransitionContext,
): ExchangeState[] {
  const rule = RULES[action];

  if (TERMINAL_STATES.includes(context.state)) {
    throw new InvalidTransitionError(
      action,
      context.state,
      `Exchange is ${context.state} and cannot be modified`,
    );
  }

  if (!rule.from.includes(context.state)) {
    throw new InvalidTransitionError(
      action,
      context.state,
      `Cannot ${action} from ${context.state}; expected one of ${rule.from.join(', ')}`,
    );
  }

  const rejection = rule.guard?.(context);
  if (rejection) {
    throw new InvalidTransitionError(action, context.state, rejection);
  }

  return rule.path(context);
}

/** Convenience wrapper for callers that only need the resulting state. */
export function nextState(action: ExchangeAction, context: TransitionContext): ExchangeState {
  const path = resolveTransition(action, context);
  return path[path.length - 1];
}

/**
 * Whether a BROKEN exchange still owes a fragment check. Used by `/complete`
 * to verify the fragment rule was satisfied rather than merely skipped.
 */
export function requiresFragmentCheck(exchangeTypeCode: string | null): boolean {
  return exchangeTypeCode === BROKEN_EXCHANGE_TYPE;
}
