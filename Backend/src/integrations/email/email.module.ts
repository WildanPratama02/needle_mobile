import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EMAIL_CLIENT } from './email.port';
import { NodemailerEmailAdapter } from './nodemailer-email.adapter';

/**
 * Binds the email port to the nodemailer/SMTP adapter. Swapping to a
 * transactional email vendor later is one line here; no domain module names
 * the vendor (Backend/CLAUDE.md §3).
 */
@Module({
  imports: [ConfigModule],
  providers: [{ provide: EMAIL_CLIENT, useClass: NodemailerEmailAdapter }],
  exports: [EMAIL_CLIENT],
})
export class EmailModule {}
