import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WhatsAppMessage, WhatsAppPort, WhatsAppSendResult } from './whatsapp.port';

interface MetaSendResponse {
  messages?: { id: string }[];
  error?: { message?: string };
}

/**
 * Meta Cloud API, called directly rather than through a BSP
 * (Backend/CLAUDE.md §6).
 *
 * The only file that knows which provider is in use. Credentials come from
 * validated config and never from the database (Docs/11 §26, Docs/14 §12).
 */
@Injectable()
export class MetaCloudWhatsAppAdapter implements WhatsAppPort {
  private readonly logger = new Logger(MetaCloudWhatsAppAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async sendTemplate(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const apiUrl = this.config.get<string>('whatsapp.apiUrl', 'https://graph.facebook.com/v21.0');
    const phoneNumberId = this.config.get<string>('whatsapp.phoneNumberId');
    const accessToken = this.config.get<string>('whatsapp.accessToken');

    // Credentials are optional in dev (.env.example ships them blank), so fail
    // loudly here rather than firing an unauthenticated request at Meta.
    if (!phoneNumberId || !accessToken) {
      throw new ServiceUnavailableException('WhatsApp credentials are not configured');
    }

    const response = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: message.to,
        type: 'template',
        template: {
          name: message.templateCode,
          language: { code: this.config.get<string>('whatsapp.templateLanguage', 'en') },
          components: [
            {
              type: 'body',
              parameters: message.variables.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      }),
    });

    const body = (await response.json().catch(() => ({}))) as MetaSendResponse;

    if (!response.ok) {
      const reason = body.error?.message ?? `HTTP ${response.status}`;
      this.logger.warn(`WhatsApp send rejected: ${reason}`);
      throw new ServiceUnavailableException(`WhatsApp provider rejected the message: ${reason}`);
    }

    const providerMessageId = body.messages?.[0]?.id;

    if (!providerMessageId) {
      throw new ServiceUnavailableException('WhatsApp provider returned no message id');
    }

    return { providerMessageId };
  }
}
