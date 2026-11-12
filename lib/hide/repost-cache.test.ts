import { describe, expect, test } from 'bun:test';
import {
  COUNT_TTL_MS,
  REPOST_CACHE_CAP,
  REPOST_TTL_MS,
  cachedFacts,
  emptyRepostCache,
  freshEntry,
  mergeRepostCaches,
  parseStoredRepostCache,
  serializeRepostCache,
  withRepostEntry,
} from './repost-cache.ts';

const NOW = 10 * REPOST_TTL_MS;

describe('repost cache', () => {
  test('a recorded entry is fresh and round-trips through storage', () => {
    const cache = withRepostEntry(emptyRepostCache(), '1', { reposted: true }, NOW);
    expect(freshEntry(cache, '1', NOW + 1000)).toEqual({ reposted: true, checkedAt: NOW });
    const back = parseStoredRepostCache(serializeRepostCache(cache), NOW);
    expect(freshEntry(back, '1', NOW)?.reposted).toBe(true);
  });

  test('an entry older than seven days is unknown and dropped on parse', () => {
    const cache = withRepostEntry(emptyRepostCache(), '1', { reposted: true }, NOW);
    expect(freshEntry(cache, '1', NOW + REPOST_TTL_MS)).toBeUndefined();
    const stored = serializeRepostCache(cache);
    expect(parseStoredRepostCache(stored, NOW + REPOST_TTL_MS).size).toBe(0);
  });

  test('past the cap the oldest entries go first', () => {
    let cache = emptyRepostCache();
    for (let id = 1; id <= REPOST_CACHE_CAP + 2; id += 1) {
      cache = withRepostEntry(cache, String(id), { reposted: false }, NOW + id);
    }
    expect(cache.size).toBe(REPOST_CACHE_CAP);
    expect(cache.has('1')).toBe(false);
    expect(cache.has('2')).toBe(false);
    expect(cache.has('3')).toBe(true);
  });

  test('anything unreadable parses to an empty cache or skips the bad entry', () => {
    expect(parseStoredRepostCache(undefined, NOW).size).toBe(0);
    expect(
      parseStoredRepostCache(
        { version: 3, entries: { '1': { reposted: true, checkedAt: NOW } } },
        NOW,
      ).size,
    ).toBe(0);
    const mixed = {
      version: 4,
      entries: {
        '5': { reposted: true, checkedAt: NOW },
        x: { reposted: true, checkedAt: NOW },
        '6': { reposted: 'yes', checkedAt: NOW },
      },
    };
    expect([...parseStoredRepostCache(mixed, NOW).keys()]).toEqual(['5']);
  });

  test('merging keeps the newer entry for a job', () => {
    const older = withRepostEntry(emptyRepostCache(), '1', { reposted: false }, NOW);
    const newer = withRepostEntry(emptyRepostCache(), '1', { reposted: true }, NOW + 5);
    expect(mergeRepostCaches(older, newer, NOW + 5).get('1')?.reposted).toBe(true);
    expect(mergeRepostCaches(newer, older, NOW + 5).get('1')?.reposted).toBe(true);
  });

  test('a count is stored and round-trips, including over-100', () => {
    let cache = withRepostEntry(emptyRepostCache(), '1', { reposted: false, applicants: 42 }, NOW);
    cache = withRepostEntry(cache, '2', { reposted: false, applicants: 'over-100' }, NOW);
    const back = parseStoredRepostCache(serializeRepostCache(cache), NOW);
    expect(back.get('1')?.applicants).toBe(42);
    expect(back.get('2')?.applicants).toBe('over-100');
  });

  test('a count is trusted for 24 hours, then unknown and stale while the repost stays known', () => {
    const cache = withRepostEntry(emptyRepostCache(), '1', { reposted: true, applicants: 42 }, NOW);
    expect(cachedFacts(cache, '1', NOW + COUNT_TTL_MS - 1)).toEqual({
      reposted: true,
      applicants: 42,
      countStale: false,
    });
    expect(cachedFacts(cache, '1', NOW + COUNT_TTL_MS)).toEqual({
      reposted: true,
      applicants: undefined,
      countStale: true,
    });
    expect(cachedFacts(cache, '1', NOW + REPOST_TTL_MS)).toBeUndefined();
  });

  test('a bad stored count is dropped without losing the entry', () => {
    const raw = {
      version: 4,
      entries: { '1': { reposted: true, checkedAt: NOW, applicants: 'lots' } },
    };
    const parsed = parseStoredRepostCache(raw, NOW);
    expect(parsed.get('1')).toEqual({ reposted: true, checkedAt: NOW });
  });
});
