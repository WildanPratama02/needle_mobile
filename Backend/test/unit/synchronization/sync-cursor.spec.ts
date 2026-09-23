import { BadRequestException } from '@nestjs/common';

import { versionOf } from '../../../src/modules/synchronization/services/master-data-version';
import {
  ORIGIN,
  decodeCursor,
  encodeCursor,
} from '../../../src/modules/synchronization/services/sync-cursor';

describe('sync cursor', () => {
  it('round-trips a watermark, keeping microseconds', () => {
    const watermark = {
      t: '2026-08-05T08:00:00.123456Z',
      id: '11111111-1111-4111-8111-111111111111',
    };

    expect(decodeCursor(encodeCursor(watermark))).toEqual(watermark);
  });

  it('accepts the origin', () => {
    expect(decodeCursor(encodeCursor(ORIGIN))).toEqual(ORIGIN);
  });

  it.each([
    'not base64 json',
    Buffer.from('{"t":"yesterday","id":"11111111-1111-4111-8111-111111111111"}').toString(
      'base64url',
    ),
    Buffer.from('{"t":"2026-08-05T08:00:00Z","id":"nope"}').toString('base64url'),
    Buffer.from('null').toString('base64url'),
  ])('refuses %p', (cursor) => {
    expect(() => decodeCursor(cursor)).toThrow(BadRequestException);
  });
});

describe('versionOf', () => {
  const row = (id: string, iso: string) => ({ id, updatedAt: new Date(iso) });

  it('ignores row order', () => {
    const a = row('a', '2026-01-01T00:00:00Z');
    const b = row('b', '2026-01-02T00:00:00Z');

    expect(versionOf([a, b])).toBe(versionOf([b, a]));
  });

  it('changes on an edit, a new row and a removed row', () => {
    const base = [row('a', '2026-01-01T00:00:00Z'), row('b', '2026-01-02T00:00:00Z')];
    const version = versionOf(base);

    expect(versionOf([base[0], row('b', '2026-01-03T00:00:00Z')])).not.toBe(version);
    expect(versionOf([...base, row('c', '2026-01-01T00:00:00Z')])).not.toBe(version);
    expect(versionOf([base[0]])).not.toBe(version);
  });

  it('folds in a related row through extra', () => {
    const rows = [row('a', '2026-01-01T00:00:00Z')];

    expect(versionOf(rows, () => 'x')).not.toBe(versionOf(rows, () => 'y'));
  });
});
