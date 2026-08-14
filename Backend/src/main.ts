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
