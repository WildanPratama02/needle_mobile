/**
 * Outbound transactional email — password reset only (ADR 0002).
 *
 * Deliberately narrower than WhatsAppPort's template abstraction: there is one
 * caller and one message today, so a raw subject/html pair is enough. Add a
 * template mechanism if a second email is ever needed, not before.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailPort {
  sendMail(message: EmailMessage): Promise<void>;
}

export const EMAIL_CLIENT = Symbol('EMAIL_CLIENT');
