import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MetaCloudWhatsAppAdapter } from './meta-cloud-whatsapp.adapter';
import { WHATSAPP_CLIENT } from './whatsapp.port';

/**
 * Binds the WhatsApp port to the Meta Cloud API adapter. Swapping providers is
 * one line here; no domain module names a provider (Backend/CLAUDE.md §7).
 */
@Module({
  imports: [ConfigModule],
  providers: [{ provide: WHATSAPP_CLIENT, useClass: MetaCloudWhatsAppAdapter }],
  exports: [WHATSAPP_CLIENT],
})
export class WhatsAppModule {}
