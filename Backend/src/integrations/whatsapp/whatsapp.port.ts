/**
 * Outbound WhatsApp, and nothing else.
 *
 * ADR-006: WhatsApp is a one-way notification channel. There is deliberately
 * no receive/webhook method on this port — round 4 Q12 supersedes Docs/14
 * §7-8, so no inbound message can ever reach a mutation. Approve and reject
 * happen only through the authenticated confirmation endpoints.
 */
export interface WhatsAppMessage {
  /** E.164 destination. */
  to: string;
  /** Provider-approved template name, e.g. `BROKEN_NEEDLE_CONFIRMATION`. */
  templateCode: string;
  /** Ordered template body variables. */
  variables: string[];
}

export interface WhatsAppSendResult {
  providerMessageId: string;
}

export interface WhatsAppPort {
  sendTemplate(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}

export const WHATSAPP_CLIENT = Symbol('WHATSAPP_CLIENT');
