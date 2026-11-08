import { describe, expect, test } from 'bun:test';
import {
  companyKey,
  emptyBlocklist,
  isBlocked,
  parseStoredBlocklist,
  serializeBlocklist,
  withBlocked,
  withoutBlocked,
  type Blocklist,
} from './domain.ts';

function names(list: Blocklist): readonly string[] {
  return list.entries.map((entry) => entry.name);
}

function readyList(raw: unknown): Blocklist {
  const parsed = parseStoredBlocklist(raw);
  if (parsed.status !== 'ready') {
    throw new Error('expected a ready read');
  }
  return parsed.list;
}

describe('companyKey and matching', () => {
  test('ignores case and surrounding or repeated whitespace', () => {
    expect(companyKey('  Amazon   Web\tServices ')).toBe(companyKey('amazon web services'));
  });

  test('a blocked name matches only its exact normalized form', () => {
    const list = withBlocked(emptyBlocklist(), 'Amazon', 1);
    expect(isBlocked(list, '  AMAZON ')).toBe(true);
    expect(isBlocked(list, 'Amazon Web Services (AWS)')).toBe(false);
    expect(isBlocked(list, 'Amaz')).toBe(false);
  });

  test('Private Company blocks like any other name', () => {
    const list = withBlocked(emptyBlocklist(), 'Private Company', 1);
    expect(isBlocked(list, 'private company')).toBe(true);
    expect(isBlocked(list, 'CBRE')).toBe(false);
  });
});

describe('withBlocked and withoutBlocked', () => {
  test('blocking keeps the name as shown, trimmed, and stamps the time', () => {
    const list = withBlocked(emptyBlocklist(), '  CBRE ', 42);
    expect(list.entries).toEqual([{ name: 'CBRE', blockedAt: 42 }]);
  });

  test('blocking twice keeps one entry with the first time', () => {
    const once = withBlocked(emptyBlocklist(), 'CBRE', 1);
    const twice = withBlocked(once, ' cbre', 2);
    expect(twice.entries).toEqual([{ name: 'CBRE', blockedAt: 1 }]);
  });

  test('a blank name blocks nothing', () => {
    expect(withBlocked(emptyBlocklist(), '   ', 1).entries).toEqual([]);
  });

  test('newest blocks come first', () => {
    let list = emptyBlocklist();
    list = withBlocked(list, 'A', 1);
    list = withBlocked(list, 'B', 2);
    list = withBlocked(list, 'C', 3);
    expect(names(list)).toEqual(['C', 'B', 'A']);
  });

  test('unblocking removes the company and leaves the rest in order', () => {
    let list = emptyBlocklist();
    list = withBlocked(list, 'A', 1);
    list = withBlocked(list, 'B', 2);
    list = withBlocked(list, 'C', 3);
    const next = withoutBlocked(list, ' b ');
    expect(names(next)).toEqual(['C', 'A']);
    expect(isBlocked(next, 'B')).toBe(false);
  });

  test('unblocking a company that is not blocked changes nothing', () => {
    const list = withBlocked(emptyBlocklist(), 'A', 1);
    expect(names(withoutBlocked(list, 'Z'))).toEqual(['A']);
  });
});

describe('parseStoredBlocklist', () => {
  test('a missing value is an empty list', () => {
    expect(readyList(undefined).entries).toEqual([]);
  });

  test('a valid document reads newest first', () => {
    const list = readyList({
      version: 1,
      entries: [
        { name: 'Old', blockedAt: 1 },
        { name: 'New', blockedAt: 2 },
      ],
    });
    expect(names(list)).toEqual(['New', 'Old']);
  });

  test('duplicate keys in a stored document collapse to the newest', () => {
    const list = readyList({
      version: 1,
      entries: [
        { name: 'cbre', blockedAt: 1 },
        { name: 'CBRE', blockedAt: 2 },
      ],
    });
    expect(list.entries).toEqual([{ name: 'CBRE', blockedAt: 2 }]);
  });

  test('malformed documents are unreadable', () => {
    const malformed: unknown[] = [
      null,
      'blocked',
      [],
      {},
      { version: 2, entries: [] },
      { version: 1 },
      { version: 1, entries: 'CBRE' },
      { version: 1, entries: ['CBRE'] },
      { version: 1, entries: [{ name: 'CBRE' }] },
      { version: 1, entries: [{ name: 'CBRE', blockedAt: 'now' }] },
      { version: 1, entries: [{ name: 'CBRE', blockedAt: Number.NaN }] },
      { version: 1, entries: [{ name: '  ', blockedAt: 1 }] },
      { version: 1, entries: [{ name: 7, blockedAt: 1 }] },
    ];
    for (const raw of malformed) {
      expect(parseStoredBlocklist(raw).status).toBe('unreadable');
    }
  });

  test('serializing then parsing round-trips the list', () => {
    let list = emptyBlocklist();
    list = withBlocked(list, 'Amazon', 1);
    list = withBlocked(list, 'Amazon Web Services (AWS)', 2);
    const stored = JSON.parse(JSON.stringify(serializeBlocklist(list)));
    expect(readyList(stored).entries).toEqual(list.entries);
  });
});
