import configuration from '../../../src/config/configuration';

/**
 * `CORS_ORIGINS` is the only thing standing between "no browser may call this"
 * and "this one may", so its parsing is worth pinning — particularly the empty
 * case, which must stay closed.
 */
describe('CORS_ORIGINS parsing', () => {
  const original = process.env.CORS_ORIGINS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = original;
    }
  });

  const origins = (value?: string) => {
    if (value === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = value;
    }
    return configuration().app.corsOrigins;
  };

  it('parses a single origin', () => {
    expect(origins('http://localhost:5173')).toEqual(['http://localhost:5173']);
  });

  it('parses a comma-separated list', () => {
    expect(origins('http://a.test,http://b.test')).toEqual(['http://a.test', 'http://b.test']);
  });

  it('trims surrounding whitespace', () => {
    expect(origins(' http://a.test , http://b.test ')).toEqual(['http://a.test', 'http://b.test']);
  });

  it('drops empty entries from a trailing comma', () => {
    expect(origins('http://a.test,,http://b.test,')).toEqual(['http://a.test', 'http://b.test']);
  });

  // An empty list leaves CORS disabled, so a forgotten setting stays closed
  // rather than silently opening the API to every origin.
  it('yields an empty list when unset', () => {
    expect(origins(undefined)).toEqual([]);
  });

  it('yields an empty list for an empty string', () => {
    expect(origins('')).toEqual([]);
  });

  it('yields an empty list for whitespace only', () => {
    expect(origins('   ')).toEqual([]);
  });

  it('carries a wildcard through as an explicit opt-in', () => {
    expect(origins('*')).toEqual(['*']);
  });
});
