import * as Joi from 'joi';

/**
 * Boot-time env validation. A misconfigured deploy should fail loudly at
 * startup, not halfway through an exchange transaction.
 */
export const validationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api'),
  SWAGGER_PATH: Joi.string().default('docs'),
  // Browser origins allowed to call the API, comma separated. Empty disables
  // CORS entirely — the Android client does not need it.
  CORS_ORIGINS: Joi.string().allow('').default(''),
  // Base URL of the WebApps app, used to build the password reset link.
  WEBAPP_URL: Joi.string().uri().default('http://localhost:5173'),

  // Database
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),

  // Auth
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // Object storage (MinIO)
  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().port().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ROOT_USER: Joi.string().required(),
  MINIO_ROOT_PASSWORD: Joi.string().required(),
  MINIO_BUCKET: Joi.string().default('needle-evidence'),

  // WhatsApp (Meta Cloud API) — credentials optional until the integration ticket lands.
  WHATSAPP_API_URL: Joi.string().uri().default('https://graph.facebook.com/v21.0'),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().allow('').default(''),
  WHATSAPP_ACCESS_TOKEN: Joi.string().allow('').default(''),
  WHATSAPP_TEMPLATE_LANGUAGE: Joi.string().default('en'),

  // SMTP (forgot-password email) — credentials optional in dev, same as WhatsApp above.
  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASSWORD: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().default('Needle Mobile System <no-reply@needle.local>'),

  // Domain
  CONFIRMATION_TTL_HOURS: Joi.number().integer().min(1).default(24),
  // How long a stored idempotent response stays replayable before it is swept.
  IDEMPOTENCY_RETENTION_HOURS: Joi.number().integer().min(1).default(24),
});
