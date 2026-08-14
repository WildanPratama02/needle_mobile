/**
 * Provider-approved template names and their body variables.
 *
 * `BROKEN_NEEDLE_CONFIRMATION` is the one named in Docs/14 §6. The other two
 * are authored for this ticket — Docs/14 covers only the confirmation request,
 * but ticket 08 also requires notifying the PIC when a confirmation is decided
 * and when an exchange gets stuck.
 *
 * Variable order matters: Meta substitutes body placeholders positionally.
 * Docs/14 §12 warns against unnecessary sensitive content, so these carry
 * identifiers and names, never phone numbers or personal data.
 */
export const TEMPLATES = {
  CONFIRMATION_REQUESTED: 'BROKEN_NEEDLE_CONFIRMATION',
  CONFIRMATION_DECIDED: 'NEEDLE_CONFIRMATION_DECIDED',
  EXCHANGE_STUCK: 'NEEDLE_EXCHANGE_STUCK',
} as const;

/** Why an exchange stopped advancing — carried into the stuck notification. */
export const STUCK_REASONS = {
  CONFIRMATION_REJECTED: 'CONFIRMATION_REJECTED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
} as const;

export type StuckReason = (typeof STUCK_REASONS)[keyof typeof STUCK_REASONS];

const STUCK_TEXT: Record<StuckReason, string> = {
  CONFIRMATION_REJECTED: 'The approver rejected the confirmation.',
  INSUFFICIENT_STOCK: 'The trolley does not hold enough stock to issue the new needle.',
};

export function stuckReasonText(reason: StuckReason): string {
  return STUCK_TEXT[reason];
}

export type TemplateCode = (typeof TEMPLATES)[keyof typeof TEMPLATES];

/**
 * The body parameters each template declares, **in the order Meta substitutes
 * them**.
 *
 * `BROKEN_NEEDLE_CONFIRMATION` mirrors the body in Docs/14 §6 line for line:
 * Exchange No, Factory, Trolley, Operator, Needle Type.
 *
 * This is the contract. Dispatch projects a payload through it rather than
 * enumerating the payload's own keys — key order is an implementation detail of
 * however the object literal happened to be written, and reordering two lines
 * in a service would silently reorder a message a supervisor reads.
 */
export const TEMPLATE_VARIABLES: Record<TemplateCode, readonly string[]> = {
  [TEMPLATES.CONFIRMATION_REQUESTED]: [
    'exchangeNumber',
    'factoryName',
    'trolleyName',
    'operatorName',
    'needleType',
  ],
  [TEMPLATES.CONFIRMATION_DECIDED]: ['exchangeNumber', 'decision'],
  [TEMPLATES.EXCHANGE_STUCK]: ['exchangeNumber', 'trolleyName', 'reason'],
};

/**
 * A template could not be rendered. Permanent by nature — a retry sends the
 * same broken payload — so dispatch fails the notification immediately rather
 * than backing off.
 */
export class TemplateVariableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateVariableError';
  }
}

/**
 * Projects a payload onto a template's declared parameters.
 *
 * Missing parameters are an error: sending a partial parameter list shifts
 * every later placeholder in the rendered message. Extra keys are dropped —
 * the template declares what it takes, and passing anything else would push
 * Meta's positional substitution out of alignment.
 */
export function resolveTemplateVariables(
  templateCode: string,
  payload: Record<string, string> | null | undefined,
): string[] {
  const declared = TEMPLATE_VARIABLES[templateCode as TemplateCode];

  if (!declared) {
    throw new TemplateVariableError(`Unknown template code: ${templateCode}`);
  }

  const values = payload ?? {};
  const missing = declared.filter((name) => values[name] === undefined || values[name] === null);

  if (missing.length > 0) {
    throw new TemplateVariableError(
      `Template ${templateCode} is missing variable(s): ${missing.join(', ')}`,
    );
  }

  return declared.map((name) => values[name]);
}
