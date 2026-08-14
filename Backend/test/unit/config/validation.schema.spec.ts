import { validationSchema } from '../../../src/config/validation.schema';

const minimalEnv = {
  DATABASE_URL: 'postgresql://needle:pw@localhost:5432/needle_dev?schema=public',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  MINIO_ROOT_USER: 'needle_minio',
  MINIO_ROOT_PASSWORD: 'needle_minio_password',
};

describe('env validation schema', () => {
  it('accepts a minimal env and fills in defaults', () => {
    const result = validationSchema.validate(minimalEnv, { abortEarly: false });
    const env = result.value as Record<string, unknown>;

    expect(result.error).toBeUndefined();
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PREFIX).toBe('api');
    expect(env.CONFIRMATION_TTL_HOURS).toBe(24);
    expect(env.MINIO_BUCKET).toBe('needle-evidence');
  });

  it('rejects a missing JWT secret', () => {
    const { JWT_SECRET: _omitted, ...withoutSecret } = minimalEnv;

    const { error } = validationSchema.validate(withoutSecret, { abortEarly: false });

    expect(error?.message).toContain('JWT_SECRET');
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    const { error } = validationSchema.validate(
      { ...minimalEnv, DATABASE_URL: 'mysql://needle:pw@localhost:3306/needle_dev' },
      { abortEarly: false },
    );

    expect(error?.message).toContain('DATABASE_URL');
  });

  it('rejects a confirmation TTL below one hour', () => {
    const { error } = validationSchema.validate(
      { ...minimalEnv, CONFIRMATION_TTL_HOURS: 0 },
      { abortEarly: false },
    );

    expect(error?.message).toContain('CONFIRMATION_TTL_HOURS');
  });
});
