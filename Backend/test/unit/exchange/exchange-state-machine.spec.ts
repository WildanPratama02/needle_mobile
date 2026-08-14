import { ConfirmationStatus, ExchangeState, FragmentStatus } from '@prisma/client';

import {
  ExchangeAction,
  InvalidTransitionError,
  NON_TERMINAL_STATES,
  TransitionContext,
  nextState,
  requiresStockReversal,
  resolveTransition,
} from '../../../src/modules/exchange/services/exchange-state-machine';

const base = (overrides: Partial<TransitionContext> = {}): TransitionContext => ({
  state: ExchangeState.CREATED,
  exchangeTypeCode: null,
  fragmentStatus: null,
  confirmationStatus: null,
  ...overrides,
});

const ALL_ACTIONS: ExchangeAction[] = [
  'IDENTIFY_OPERATOR',
  'SELECT_TYPE',
  'RECORD_FRAGMENT',
  'CAPTURE_EVIDENCE',
  'SELECT_NEW_NEEDLE',
  'ISSUE_NEEDLE',
  'STORE_USED_NEEDLE',
  'COMPLETE',
  'CANCEL',
];

describe('exchange state machine — valid transitions', () => {
  it('CREATED -> OPERATOR_IDENTIFIED', () => {
    expect(nextState('IDENTIFY_OPERATOR', base())).toBe(ExchangeState.OPERATOR_IDENTIFIED);
  });

  // Round 4 Q5: NEEDLE_SELECTED is transient, written inside /type's transaction.
  it('/type writes NEEDLE_SELECTED then EXCHANGE_TYPE_SELECTED', () => {
    const path = resolveTransition(
      'SELECT_TYPE',
      base({ state: ExchangeState.OPERATOR_IDENTIFIED }),
    );

    expect(path).toEqual([ExchangeState.NEEDLE_SELECTED, ExchangeState.EXCHANGE_TYPE_SELECTED]);
  });

  it('BROKEN with fragment FOUND stops at FRAGMENT_CHECK', () => {
    const path = resolveTransition(
      'RECORD_FRAGMENT',
      base({
        state: ExchangeState.EXCHANGE_TYPE_SELECTED,
        exchangeTypeCode: 'BROKEN',
        fragmentStatus: FragmentStatus.FOUND,
      }),
    );

    expect(path).toEqual([ExchangeState.FRAGMENT_CHECK]);
  });

  it('BROKEN with fragment NOT_FOUND continues to CONFIRMATION_PENDING', () => {
    const path = resolveTransition(
      'RECORD_FRAGMENT',
      base({
        state: ExchangeState.EXCHANGE_TYPE_SELECTED,
        exchangeTypeCode: 'BROKEN',
        fragmentStatus: FragmentStatus.NOT_FOUND,
      }),
    );

    expect(path).toEqual([ExchangeState.FRAGMENT_CHECK, ExchangeState.CONFIRMATION_PENDING]);
  });

  // Round 4 Q6: BENT / CHANGEOVER skip FRAGMENT_CHECK entirely.
  it.each(['BENT', 'CHANGEOVER'])('%s goes straight from type selection to evidence', (code) => {
    expect(
      nextState(
        'CAPTURE_EVIDENCE',
        base({ state: ExchangeState.EXCHANGE_TYPE_SELECTED, exchangeTypeCode: code }),
      ),
    ).toBe(ExchangeState.EVIDENCE_CAPTURED);
  });

  it('BROKEN with fragment found proceeds from FRAGMENT_CHECK to evidence', () => {
    expect(
      nextState(
        'CAPTURE_EVIDENCE',
        base({
          state: ExchangeState.FRAGMENT_CHECK,
          exchangeTypeCode: 'BROKEN',
          fragmentStatus: FragmentStatus.FOUND,
        }),
      ),
    ).toBe(ExchangeState.EVIDENCE_CAPTURED);
  });

  it('an approved confirmation releases the exchange to evidence', () => {
    expect(
      nextState(
        'CAPTURE_EVIDENCE',
        base({
          state: ExchangeState.CONFIRMATION_PENDING,
          exchangeTypeCode: 'BROKEN',
          fragmentStatus: FragmentStatus.NOT_FOUND,
          confirmationStatus: ConfirmationStatus.APPROVED,
        }),
      ),
    ).toBe(ExchangeState.EVIDENCE_CAPTURED);
  });

  it.each([
    ['SELECT_NEW_NEEDLE', ExchangeState.EVIDENCE_CAPTURED, ExchangeState.NEW_NEEDLE_SELECTED],
    ['ISSUE_NEEDLE', ExchangeState.NEW_NEEDLE_SELECTED, ExchangeState.NEEDLE_ISSUED],
    ['STORE_USED_NEEDLE', ExchangeState.NEEDLE_ISSUED, ExchangeState.USED_NEEDLE_STORED],
    ['COMPLETE', ExchangeState.USED_NEEDLE_STORED, ExchangeState.COMPLETED],
  ])('%s: %s -> %s', (action, from, to) => {
    expect(nextState(action as ExchangeAction, base({ state: from as ExchangeState }))).toBe(to);
  });

  it('walks a BENT exchange end to end', () => {
    let state: ExchangeState = ExchangeState.CREATED;
    const context = () => base({ state, exchangeTypeCode: 'BENT' });

    for (const action of [
      'IDENTIFY_OPERATOR',
      'SELECT_TYPE',
      'CAPTURE_EVIDENCE',
      'SELECT_NEW_NEEDLE',
      'ISSUE_NEEDLE',
      'STORE_USED_NEEDLE',
      'COMPLETE',
    ] as ExchangeAction[]) {
      state = nextState(action, context());
    }

    expect(state).toBe(ExchangeState.COMPLETED);
  });

  it('walks a BROKEN + approved exchange end to end', () => {
    let state: ExchangeState = ExchangeState.CREATED;
    let fragmentStatus: FragmentStatus | null = null;
    let confirmationStatus: ConfirmationStatus | null = null;

    state = nextState('IDENTIFY_OPERATOR', base({ state, exchangeTypeCode: 'BROKEN' }));
    state = nextState('SELECT_TYPE', base({ state, exchangeTypeCode: 'BROKEN' }));

    fragmentStatus = FragmentStatus.NOT_FOUND;
    state = nextState(
      'RECORD_FRAGMENT',
      base({ state, exchangeTypeCode: 'BROKEN', fragmentStatus }),
    );
    expect(state).toBe(ExchangeState.CONFIRMATION_PENDING);

    confirmationStatus = ConfirmationStatus.APPROVED;
    for (const action of [
      'CAPTURE_EVIDENCE',
      'SELECT_NEW_NEEDLE',
      'ISSUE_NEEDLE',
      'STORE_USED_NEEDLE',
      'COMPLETE',
    ] as ExchangeAction[]) {
      state = nextState(
        action,
        base({ state, exchangeTypeCode: 'BROKEN', fragmentStatus, confirmationStatus }),
      );
    }

    expect(state).toBe(ExchangeState.COMPLETED);
  });
});

describe('cancellation', () => {
  // Spec decision 4: cancellable from every non-terminal state, including the
  // stuck ones — cancelling is how a stuck exchange gets released.
  it.each(NON_TERMINAL_STATES)('cancels from %s', (state) => {
    expect(nextState('CANCEL', base({ state }))).toBe(ExchangeState.CANCELLED);
  });

  it('covers all ten non-terminal states', () => {
    expect(NON_TERMINAL_STATES).toHaveLength(10);
    expect(NON_TERMINAL_STATES).not.toContain(ExchangeState.COMPLETED);
    expect(NON_TERMINAL_STATES).not.toContain(ExchangeState.CANCELLED);
  });

  it('cancels a stock-blocked exchange sitting at NEW_NEEDLE_SELECTED', () => {
    expect(nextState('CANCEL', base({ state: ExchangeState.NEW_NEEDLE_SELECTED }))).toBe(
      ExchangeState.CANCELLED,
    );
  });

  it('cancels an exchange whose confirmation was REJECTED', () => {
    expect(
      nextState(
        'CANCEL',
        base({
          state: ExchangeState.CONFIRMATION_PENDING,
          exchangeTypeCode: 'BROKEN',
          fragmentStatus: FragmentStatus.NOT_FOUND,
          confirmationStatus: ConfirmationStatus.REJECTED,
        }),
      ),
    ).toBe(ExchangeState.CANCELLED);
  });
});

describe('requiresStockReversal', () => {
  // Only these two states have a decremented trolley balance behind them.
  it.each([ExchangeState.NEEDLE_ISSUED, ExchangeState.USED_NEEDLE_STORED])(
    'owes a reversal when cancelling from %s',
    (state) => {
      expect(requiresStockReversal(state)).toBe(true);
    },
  );

  it.each([
    ExchangeState.CREATED,
    ExchangeState.OPERATOR_IDENTIFIED,
    ExchangeState.NEEDLE_SELECTED,
    ExchangeState.EXCHANGE_TYPE_SELECTED,
    ExchangeState.FRAGMENT_CHECK,
    ExchangeState.CONFIRMATION_PENDING,
    ExchangeState.EVIDENCE_CAPTURED,
    ExchangeState.NEW_NEEDLE_SELECTED,
  ])('owes no reversal when cancelling from %s', (state) => {
    expect(requiresStockReversal(state)).toBe(false);
  });
});

describe('exchange state machine — rejected transitions', () => {
  it('refuses to skip the operator step', () => {
    expect(() => nextState('SELECT_TYPE', base({ state: ExchangeState.CREATED }))).toThrow(
      InvalidTransitionError,
    );
  });

  it('refuses to jump straight from CREATED to issue', () => {
    expect(() => nextState('ISSUE_NEEDLE', base({ state: ExchangeState.CREATED }))).toThrow(
      /Cannot ISSUE_NEEDLE from CREATED/,
    );
  });

  it('refuses to complete before the used needle is stored', () => {
    expect(() => nextState('COMPLETE', base({ state: ExchangeState.NEEDLE_ISSUED }))).toThrow(
      InvalidTransitionError,
    );
  });

  it.each(['BENT', 'CHANGEOVER'])('refuses a fragment check on %s', (code) => {
    expect(() =>
      nextState(
        'RECORD_FRAGMENT',
        base({ state: ExchangeState.EXCHANGE_TYPE_SELECTED, exchangeTypeCode: code }),
      ),
    ).toThrow(/applies to BROKEN exchanges only/);
  });

  it('refuses evidence on a BROKEN exchange that skipped the fragment check', () => {
    expect(() =>
      nextState(
        'CAPTURE_EVIDENCE',
        base({ state: ExchangeState.EXCHANGE_TYPE_SELECTED, exchangeTypeCode: 'BROKEN' }),
      ),
    ).toThrow(/must record its fragment status/);
  });

  // "Blocked" is not a state — the exchange simply stops advancing (CONTEXT.md).
  it.each([
    [ConfirmationStatus.PENDING],
    [ConfirmationStatus.REJECTED],
    [ConfirmationStatus.EXPIRED],
  ])('refuses to advance while the confirmation is %s', (status) => {
    expect(() =>
      nextState(
        'CAPTURE_EVIDENCE',
        base({
          state: ExchangeState.CONFIRMATION_PENDING,
          exchangeTypeCode: 'BROKEN',
          fragmentStatus: FragmentStatus.NOT_FOUND,
          confirmationStatus: status,
        }),
      ),
    ).toThrow(/cannot advance until it is APPROVED/);
  });

  it.each(ALL_ACTIONS)('refuses %s on a COMPLETED exchange', (action) => {
    expect(() => nextState(action, base({ state: ExchangeState.COMPLETED }))).toThrow(
      /cannot be modified/,
    );
  });

  it.each(ALL_ACTIONS)('refuses %s on a CANCELLED exchange', (action) => {
    expect(() => nextState(action, base({ state: ExchangeState.CANCELLED }))).toThrow(
      /cannot be modified/,
    );
  });

  it('refuses to repeat a transition already taken', () => {
    expect(() =>
      nextState('IDENTIFY_OPERATOR', base({ state: ExchangeState.OPERATOR_IDENTIFIED })),
    ).toThrow(InvalidTransitionError);
  });

  it('refuses to cancel a COMPLETED exchange', () => {
    // Docs/03 UC-MOB-014: a completed exchange is not cancellable.
    expect(() => nextState('CANCEL', base({ state: ExchangeState.COMPLETED }))).toThrow(
      /cannot be modified/,
    );
  });

  it('reports the action and origin state on the error', () => {
    try {
      nextState('COMPLETE', base({ state: ExchangeState.CREATED }));
      fail('expected the transition to be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      expect((error as InvalidTransitionError).action).toBe('COMPLETE');
      expect((error as InvalidTransitionError).from).toBe(ExchangeState.CREATED);
    }
  });
});
