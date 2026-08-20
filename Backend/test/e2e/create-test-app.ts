import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

/**
 * Boots the real application for an e2e suite.
 *
 * Uses the same `configureApp` as `main.ts`, so a suite cannot accidentally
 * exercise a differently-configured app. Every suite must go through here
 * rather than calling `setGlobalPrefix` / `useGlobalPipes` itself.
 *
 * `configureModule` is an escape hatch for the rare suite that must swap an
 * external-provider port (e.g. capturing the outbound email in the
 * forgot-password suite instead of hitting real SMTP) — it still goes through
 * this one boot path, just with one provider overridden before compile.
 */
export async function createTestApp(
  configureModule?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (configureModule) {
    builder = configureModule(builder);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return app;
}
