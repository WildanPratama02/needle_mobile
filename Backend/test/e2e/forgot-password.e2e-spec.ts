import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';
import { PrismaService } from '../../src/database/prisma.service';
import { EMAIL_CLIENT, EmailMessage, EmailPort } from '../../src/integrations/email/email.port';

/** supertest types `body` as `any`; narrow it once here rather than at each use. */
function bodyOf<T>(response: { body: unknown }): T {
  return (response.body as { data: T }).data;
}

function extractToken(message: EmailMessage): string {
  const match = /token=([0-9a-f]+)/.exec(message.html);
  if (!match) {
    throw new Error(`No reset token found in captured email: ${message.html}`);
  }
  return match[1];
}

/**
 * Runs against the real PostgreSQL, same as auth.e2e-spec.ts. The email send
 * is captured rather than sent for real — no SMTP server exists in the test
 * environment, and the point is to prove the endpoint/service/DB wiring, not
 * nodemailer itself (that adapter has no unit test of its own for the same
 * reason MetaCloudWhatsAppAdapter doesn't: it is a thin, mostly-untestable
 * wrapper over a real network call).
 */
describe('Forgot / reset password (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sentEmails: EmailMessage[];

  const suffix = Date.now().toString(36);
  const username = `e2e_reset_${suffix}`;
  const email = `${username}@needle.local`;
  const originalPassword = 'OriginalPass1';

  let userId: string;

  beforeAll(async () => {
    sentEmails = [];
    const fakeEmail: EmailPort = {
      sendMail: (message) => {
        sentEmails.push(message);
        return Promise.resolve();
      },
    };

    app = await createTestApp((builder) => builder.overrideProvider(EMAIL_CLIENT).useValue(fakeEmail));
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: { username, name: 'E2E Reset', email, passwordHash: await hash(originalPassword, 4) },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { username } });
    }
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;

  const requestReset = () =>
    request(server()).post('/api/v1/auth/forgot-password').send({ email }).expect(200);

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns the generic message and emails a reset link for a known account', async () => {
      const before = sentEmails.length;

      const response = await requestReset();

      expect(bodyOf<{ message: string }>(response).message).toMatch(/reset link has been sent/i);
      expect(sentEmails.length).toBe(before + 1);
      expect(sentEmails[sentEmails.length - 1].to).toBe(email);
    });

    it('returns the identical message for an unknown email, and sends nothing', async () => {
      const before = sentEmails.length;

      const response = await request(server())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'no_such_account@needle.local' })
        .expect(200);

      expect(bodyOf<{ message: string }>(response).message).toMatch(/reset link has been sent/i);
      expect(sentEmails.length).toBe(before);
    });

    it('rejects a malformed email with 400', async () => {
      await request(server())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('rejects an unknown token with 400', async () => {
      await request(server())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'deadbeef', newPassword: 'NewPassword1' })
        .expect(400);
    });

    it('rejects a newPassword that fails the strength rule', async () => {
      await requestReset();
      const rawToken = extractToken(sentEmails[sentEmails.length - 1]);

      await request(server())
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'nodigits' })
        .expect(400);
    });

    it('sets the new password, revokes sessions, and the token cannot be reused', async () => {
      // A live session before the reset, to prove it gets revoked.
      const loginBefore = await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password: originalPassword })
        .expect(200);
      const oldRefreshToken = bodyOf<{ refreshToken: string }>(loginBefore).refreshToken;

      await requestReset();
      const rawToken = extractToken(sentEmails[sentEmails.length - 1]);

      const resetResponse = await request(server())
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'BrandNewPass1' })
        .expect(200);
      expect(bodyOf<{ message: string }>(resetResponse).message).toMatch(/password updated/i);

      // Old password no longer works.
      await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password: originalPassword })
        .expect(401);

      // New password does.
      await request(server())
        .post('/api/v1/auth/login')
        .send({ username, password: 'BrandNewPass1' })
        .expect(200);

      // The pre-reset session was revoked.
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      // The reset token is single-use.
      await request(server())
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'AnotherPass2' })
        .expect(400);
    });
  });
});
