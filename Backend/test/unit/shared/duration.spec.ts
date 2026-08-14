import { parseDurationToSeconds } from '../../../src/shared/utils/duration';

describe('parseDurationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['12h', 43200],
    ['7d', 604800],
    ['3600', 3600],
  ])('parses %s as %i seconds', (input, expected) => {
    expect(parseDurationToSeconds(input)).toBe(expected);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseDurationToSeconds('  15m ')).toBe(900);
  });

  it.each(['', '15x', 'm15', '1.5h', 'abc'])('throws on %p', (input) => {
    expect(() => parseDurationToSeconds(input)).toThrow(/Unsupported duration format/);
  });
});
