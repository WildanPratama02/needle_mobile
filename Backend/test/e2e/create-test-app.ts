import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

/**
 * Boots the real application for an e2e suite.
 *
 * Uses the same `configureApp` as `main.ts`, so a suite cannot accidentally
 * exercise a differently-configured app. Every suite must go through here
 * rather than calling `setGlobalPrefix` / `useGlobalPipes` itself.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return app;
}
