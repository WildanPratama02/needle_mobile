import { INestApplication, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Everything about the HTTP surface that is not expressed as a Nest provider:
 * the route prefix, URI versioning and the global validation pipe.
 *
 * Extracted so `main.ts` and the e2e helper configure an application the same
 * way. They previously each set this up by hand and had already drifted — the
 * tests omitted `enableImplicitConversion`, so a numeric query parameter
 * failed `@IsInt` under test and passed in production. A shared function makes
 * that class of divergence impossible rather than merely unlikely.
 *
 * Guards, interceptors, filters and middleware are not here: they are wired in
 * `AppModule` and so already apply identically everywhere.
 */
/**
 * Headers a browser client must be allowed to send.
 *
 * `Idempotency-Key`, `X-Request-ID` and `X-Device-ID` are the common headers
 * from Docs/12 §5. Omitting any of them would make the browser reject the
 * preflight for exactly the requests that need them most.
 */
const ALLOWED_HEADERS = [
  'Authorization',
  'Content-Type',
  'Idempotency-Key',
  'X-Request-ID',
  'X-Device-ID',
];

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  const corsOrigins = config.get<string[]>('app.corsOrigins', []);

  // Only the WebApp needs this; the Android client is not subject to the
  // same-origin policy. Left off entirely when no origin is configured, so an
  // environment that forgets to set it stays closed rather than open.
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins.includes('*') ? true : corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ALLOWED_HEADERS,
      // Without this the browser hides the header, and a client could never
      // read back the request id it needs to correlate a support report.
      exposedHeaders: ['X-Request-ID'],
      // Auth travels as a bearer token, not a cookie, so credentialed
      // requests are not needed — and enabling them would forbid `*`.
      credentials: false,
      maxAge: 600,
    });
  }

  // Versioned path per Backend/CLAUDE.md §3: /api/v1/...
  //
  // The two operational probes are the sole exception. An orchestrator's probe
  // URL must not move when the API version bumps — that breaks the deployment
  // rather than the API — so they answer at `/health` and `/ready` and are
  // declared VERSION_NEUTRAL on their controller. A second exclusion for any
  // other reason should be treated as a smell.
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'ready', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Query and path parameters arrive as strings; without this every
      // numeric DTO field would need a manual @Type decorator.
      transformOptions: { enableImplicitConversion: true },
    }),
  );
}
