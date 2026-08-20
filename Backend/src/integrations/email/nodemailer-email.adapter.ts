import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

import { EmailMessage, EmailPort } from './email.port';

/**
 * SMTP via nodemailer, called directly rather than through a transactional
 * email vendor's API — no vendor account exists yet and a generic relay
 * covers any corporate mail server (ADR 0002).
 *
 * The only file that knows the delivery mechanism. Credentials come from
 * validated config, same convention as MetaCloudWhatsAppAdapter.
 */
@Injectable()
export class NodemailerEmailAdapter implements EmailPort {
  private readonly logger = new Logger(NodemailerEmailAdapter.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async sendMail(message: EmailMessage): Promise<void> {
    const host = this.config.get<string>('email.host');

    // Credentials are optional in dev (.env.example ships them blank), so fail
    // loudly here rather than letting nodemailer hang on an empty host.
    if (!host) {
      throw new ServiceUnavailableException('SMTP is not configured');
    }

    try {
      await this.getTransporter(host).sendMail({
        from: this.config.get<string>('email.from'),
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      const reason = (error as Error).message;
      this.logger.warn(`Email send rejected: ${reason}`);
      throw new ServiceUnavailableException(`Email provider rejected the message: ${reason}`);
    }
  }

  private getTransporter(host: string): Transporter {
    if (!this.transporter) {
      const user = this.config.get<string>('email.user');
      const password = this.config.get<string>('email.password');

      this.transporter = createTransport({
        host,
        port: this.config.get<number>('email.port', 587),
        secure: this.config.get<boolean>('email.secure', false),
        auth: user && password ? { user, pass: password } : undefined,
      });
    }

    return this.transporter;
  }
}
