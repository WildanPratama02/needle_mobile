import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const swaggerPath = config.get<string>('app.swaggerPath', 'docs');
  const port = config.get<number>('app.port', 3000);

  // Shared with the e2e helper so tests exercise the same HTTP surface.
  configureApp(app);

  /**
   * Lets SIGTERM run every module's `onModuleDestroy` instead of killing the
   * process outright — BullMQ workers stop taking new jobs and finish or
   * release the one in hand, and Prisma closes its pool rather than stranding
   * connections. Without it a deploy can sever a notification mid-dispatch.
   *
   * Here rather than in `configureApp` on purpose: it registers process-level
   * signal listeners, and every e2e suite builds its own application, so
   * sharing it would attach a set per test app. Same reasoning that keeps
   * Swagger in this file (ARCHITECTURE.md, "known remaining differences").
   */
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Needle Mobile System API')
    .setDescription(
      'Backend REST API for the needle exchange / inventory system. Contract of record: Docs/12-OpenAPI-Swagger-Specification.md.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(swaggerPath, app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(port);

  console.log(`Needle backend listening on http://localhost:${port}/${apiPrefix}/v1`);

  console.log(`Swagger UI at http://localhost:${port}/${swaggerPath}`);
}

void bootstrap();
