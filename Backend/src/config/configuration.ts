/**
 * Typed view over process.env. Everything the app reads from the environment
 * goes through here — no `process.env.X` scattered across modules.
 *
 * Shape is validated at boot by `validation.schema.ts`, so values are safe to
 * assert as present by the time this factory runs.
 */
const configuration = () => ({
  app: {
    env: process.env.NODE_ENV as 'development' | 'test' | 'production',
    port: parseInt(process.env.PORT as string, 10),
    apiPrefix: process.env.API_PREFIX as string,
    swaggerPath: process.env.SWAGGER_PATH as string,
    // Comma-separated allow-list. Empty means CORS stays off, so an
    // environment that never configures it cannot accidentally open up.
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    // Base URL of the WebApps management app — used to build links that leave
    // the API, e.g. the password reset email.
    webUrl: process.env.WEBAPP_URL as string,
  },
  database: {
    url: process.env.DATABASE_URL as string,
  },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN as string,
    refreshSecret: process.env.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN as string,
  },
  redis: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string, 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  objectStorage: {
    endpoint: process.env.MINIO_ENDPOINT as string,
    port: parseInt(process.env.MINIO_PORT as string, 10),
    useSsl: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER as string,
    secretKey: process.env.MINIO_ROOT_PASSWORD as string,
    bucket: process.env.MINIO_BUCKET as string,
  },
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL as string,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || undefined,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || undefined,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE as string,
  },
  // Transactional email (forgot-password only — ADR 0002). Credentials are
  // optional in dev, same convention as the WhatsApp block above: the app boots
  // without them, and the adapter fails loudly only when a send is attempted.
  email: {
    host: process.env.SMTP_HOST || undefined,
    port: parseInt(process.env.SMTP_PORT as string, 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASSWORD || undefined,
    from: process.env.SMTP_FROM as string,
  },
  domain: {
    confirmationTtlHours: parseInt(process.env.CONFIRMATION_TTL_HOURS as string, 10),
    idempotencyRetentionHours: parseInt(process.env.IDEMPOTENCY_RETENTION_HOURS as string, 10),
  },
});

export type AppConfig = ReturnType<typeof configuration>;

export default configuration;
